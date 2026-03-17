import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AppDataSource } from '../../config/database';
import { UserEntity, UserRole, UserStatus } from './entities/user.entity';
import { SessionEntity } from './entities/session.entity';
import { env } from '../../config/env';
import { getRedis } from '../../config/redis';
import { AppError } from '../../shared/error-handler';
import { logger } from '../../config/logger';

const userRepo = () => AppDataSource.getRepository(UserEntity);
const sessionRepo = () => AppDataSource.getRepository(SessionEntity);

export class AuthService {

  // ──────────────────────────────────────
  // REGISTER
  // ──────────────────────────────────────
  async register(email: string, password: string, role: UserRole = UserRole.VIEWER) {
    const existing = await userRepo().findOneBy({ email });
    if (existing) throw new AppError(409, 'Email already registered');

    if (password.length < 8) throw new AppError(400, 'Password must be at least 8 characters');

    const passwordHash = await bcrypt.hash(password, 12);
    const user = userRepo().create({ email, passwordHash, role });
    await userRepo().save(user);

    logger.info(`User registered: ${email} as ${role}`);
    return { id: user.id, email: user.email, role: user.role };
  }

  // ──────────────────────────────────────
  // LOGIN
  // ──────────────────────────────────────
  async login(email: string, password: string, ip?: string, userAgent?: string) {
    // Rate limit check
    const redis = getRedis();
    const rateLimitKey = `login-attempts:${email}`;
    const attempts = parseInt(await redis.get(rateLimitKey) || '0');
    if (attempts >= 5) throw new AppError(429, 'Too many login attempts. Try again in 15 minutes.');

    const user = await userRepo().findOneBy({ email });
    if (!user) {
      await redis.incr(rateLimitKey);
      await redis.expire(rateLimitKey, 900); // 15 min
      throw new AppError(401, 'Invalid email or password');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new AppError(403, 'Account suspended. Contact admin.');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      user.failedLoginAttempts += 1;
      // Suspend after 10 consecutive failures
      if (user.failedLoginAttempts >= 10) {
        user.status = UserStatus.SUSPENDED;
        logger.warn(`Account suspended due to failed attempts: ${email}`);
      }
      await userRepo().save(user);
      await redis.incr(rateLimitKey);
      await redis.expire(rateLimitKey, 900);
      throw new AppError(401, 'Invalid email or password');
    }

    // Success — reset counters
    user.failedLoginAttempts = 0;
    user.lastLogin = new Date();
    await userRepo().save(user);
    await redis.del(rateLimitKey);

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken();

    // Save session
    const session = sessionRepo().create({
      userId: user.id,
      refreshTokenHash: this.hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      ipAddress: ip,
      userAgent: userAgent,
    });
    await sessionRepo().save(session);

    logger.info(`User logged in: ${email} (${user.role})`);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  // ──────────────────────────────────────
  // REFRESH TOKEN
  // ──────────────────────────────────────
  async refreshToken(token: string) {
    const hash = this.hashToken(token);
    const session = await sessionRepo().findOneBy({ refreshTokenHash: hash });

    if (!session) throw new AppError(401, 'Invalid refresh token');
    if (session.expiresAt < new Date()) {
      await sessionRepo().remove(session);
      throw new AppError(401, 'Refresh token expired');
    }

    const user = await userRepo().findOneBy({ id: session.userId });
    if (!user || user.status === UserStatus.SUSPENDED) throw new AppError(403, 'Account not active');

    // Rotate refresh token
    const newRefreshToken = this.generateRefreshToken();
    session.refreshTokenHash = this.hashToken(newRefreshToken);
    session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await sessionRepo().save(session);

    const accessToken = this.generateAccessToken(user);
    return { accessToken, refreshToken: newRefreshToken };
  }

  // ──────────────────────────────────────
  // LOGOUT
  // ──────────────────────────────────────
  async logout(refreshToken: string) {
    const hash = this.hashToken(refreshToken);
    const session = await sessionRepo().findOneBy({ refreshTokenHash: hash });
    if (session) await sessionRepo().remove(session);
    return { success: true };
  }

  // ──────────────────────────────────────
  // GET CURRENT USER (from JWT)
  // ──────────────────────────────────────
  async getMe(userId: string) {
    const user = await userRepo().findOneBy({ id: userId });
    if (!user) throw new AppError(404, 'User not found');
    return { id: user.id, email: user.email, role: user.role, status: user.status, lastLogin: user.lastLogin, createdAt: user.createdAt };
  }

  // ──────────────────────────────────────
  // VERIFY TOKEN (used by middleware)
  // ──────────────────────────────────────
  verifyAccessToken(token: string) {
    try {
      return jwt.verify(token, env.jwtSecret) as { userId: string; email: string; role: UserRole; iat: number; exp: number };
    } catch {
      throw new AppError(401, 'Invalid or expired token');
    }
  }

  // ── Helpers ──
  private generateAccessToken(user: UserEntity): string {
    return jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn }
    );
  }

  private generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
