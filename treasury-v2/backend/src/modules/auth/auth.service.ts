import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { getRedis } from '../../config/redis';
import { AppError } from '../../shared/error-handler';
import {
  createSession,
  createUser,
  deleteSessionByTokenHash,
  findSessionByTokenHash,
  findUserByEmail,
  findUserById,
  rotateSessionToken,
  saveUser,
  type StoredUser,
} from './auth.store';
import { UserRole, UserStatus } from './entities/user.entity';

export class AuthService {
  async register(email: string, password: string, role: UserRole = UserRole.VIEWER) {
    const existing = await findUserByEmail(email);
    if (existing) throw new AppError(409, 'Email already registered');

    if (password.length < 8) throw new AppError(400, 'Password must be at least 8 characters');

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await createUser({ email, passwordHash, role });

    logger.info(`User registered: ${email} as ${role}`);
    return { id: user.id, email: user.email, role: user.role };
  }

  async login(email: string, password: string, ip?: string, userAgent?: string) {
    const redis = getRedis();
    const rateLimitKey = `login-attempts:${email}`;
    const attempts = parseInt((await redis.get(rateLimitKey)) || '0', 10);
    if (attempts >= 5) throw new AppError(429, 'Too many login attempts. Try again in 15 minutes.');

    const user = await findUserByEmail(email);
    if (!user) {
      await redis.incr(rateLimitKey);
      await redis.expire(rateLimitKey, 900);
      throw new AppError(401, 'Invalid email or password');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new AppError(403, 'Account suspended. Contact admin.');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 10) {
        user.status = UserStatus.SUSPENDED;
        logger.warn(`Account suspended due to failed attempts: ${email}`);
      }

      await saveUser(user);
      await redis.incr(rateLimitKey);
      await redis.expire(rateLimitKey, 900);
      throw new AppError(401, 'Invalid email or password');
    }

    user.failedLoginAttempts = 0;
    user.lastLogin = new Date();
    await saveUser(user);
    await redis.del(rateLimitKey);

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken();

    await createSession({
      userId: user.id,
      refreshTokenHash: this.hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ipAddress: ip,
      userAgent,
    });

    logger.info(`User logged in: ${email} (${user.role})`);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  async refreshToken(token: string) {
    const hash = this.hashToken(token);
    const session = await findSessionByTokenHash(hash);

    if (!session) throw new AppError(401, 'Invalid refresh token');
    if (session.expiresAt < new Date()) {
      await deleteSessionByTokenHash(session.refreshTokenHash);
      throw new AppError(401, 'Refresh token expired');
    }

    const user = await findUserById(session.userId);
    if (!user || user.status === UserStatus.SUSPENDED) throw new AppError(403, 'Account not active');

    const newRefreshToken = this.generateRefreshToken();
    await rotateSessionToken(
      session,
      this.hashToken(newRefreshToken),
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    );

    const accessToken = this.generateAccessToken(user);
    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(refreshToken: string) {
    await deleteSessionByTokenHash(this.hashToken(refreshToken));
    return { success: true };
  }

  async getMe(userId: string) {
    const user = await findUserById(userId);
    if (!user) throw new AppError(404, 'User not found');

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    };
  }

  verifyAccessToken(token: string) {
    try {
      return jwt.verify(token, env.jwtSecret) as {
        userId: string;
        email: string;
        role: UserRole;
        iat: number;
        exp: number;
      };
    } catch {
      throw new AppError(401, 'Invalid or expired token');
    }
  }

  private generateAccessToken(user: StoredUser) {
    return jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn }
    );
  }

  private generateRefreshToken() {
    return crypto.randomBytes(64).toString('hex');
  }

  private hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
