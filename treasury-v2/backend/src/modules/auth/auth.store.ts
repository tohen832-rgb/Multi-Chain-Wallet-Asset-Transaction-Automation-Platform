import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../../config/database';
import { UserRole, UserStatus } from './entities/user.entity';

const USERS_BUCKET = 'all';

type RowLike = { get(name: string): unknown };

export interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  failedLoginAttempts: number;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  role: UserRole;
  status?: UserStatus;
}

export interface StoredSession {
  id: string;
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export async function listUsers() {
  const database = getDatabase();
  const result = await database.execute(
    `SELECT id, email, password_hash, role, status, failed_login_attempts, last_login, created_at, updated_at
     FROM users_by_created
     WHERE bucket = ?`,
    [USERS_BUCKET],
    { prepare: true }
  );

  return result.rows.map((row) => mapUser(row)).filter((user): user is StoredUser => Boolean(user));
}

export async function findUserById(id: string) {
  const database = getDatabase();
  const result = await database.execute(
    `SELECT id, email, password_hash, role, status, failed_login_attempts, last_login, created_at, updated_at
     FROM users_by_id
     WHERE id = ?`,
    [id],
    { prepare: true }
  );

  return mapUser(result.first());
}

export async function findUserByEmail(email: string) {
  const database = getDatabase();
  const result = await database.execute(
    `SELECT id, email, password_hash, role, status, failed_login_attempts, last_login, created_at, updated_at
     FROM users_by_email
     WHERE email = ?`,
    [email],
    { prepare: true }
  );

  return mapUser(result.first());
}

export async function createUser(input: CreateUserInput) {
  const now = new Date();
  const user: StoredUser = {
    id: uuidv4(),
    email: input.email,
    passwordHash: input.passwordHash,
    role: input.role,
    status: input.status ?? UserStatus.ACTIVE,
    failedLoginAttempts: 0,
    lastLogin: null,
    createdAt: now,
    updatedAt: now,
  };

  await upsertUser(user);
  return user;
}

export async function saveUser(user: StoredUser) {
  const updatedUser: StoredUser = {
    ...user,
    updatedAt: new Date(),
  };

  await upsertUser(updatedUser);
  return updatedUser;
}

export async function deleteUser(user: StoredUser) {
  const database = getDatabase();

  await database.batch(
    [
      { query: 'DELETE FROM users_by_id WHERE id = ?', params: [user.id] },
      { query: 'DELETE FROM users_by_email WHERE email = ?', params: [user.email] },
      {
        query: 'DELETE FROM users_by_created WHERE bucket = ? AND created_at = ? AND id = ?',
        params: [USERS_BUCKET, user.createdAt, user.id],
      },
    ],
    { prepare: true }
  );
}

export async function createSession(input: {
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}) {
  const database = getDatabase();
  const session: StoredSession = {
    id: uuidv4(),
    userId: input.userId,
    refreshTokenHash: input.refreshTokenHash,
    expiresAt: input.expiresAt,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    createdAt: new Date(),
  };

  await database.execute(
    `INSERT INTO sessions_by_token_hash (
      refresh_token_hash, id, user_id, expires_at, ip_address, user_agent, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      session.refreshTokenHash,
      session.id,
      session.userId,
      session.expiresAt,
      session.ipAddress,
      session.userAgent,
      session.createdAt,
    ],
    { prepare: true }
  );

  return session;
}

export async function findSessionByTokenHash(refreshTokenHash: string) {
  const database = getDatabase();
  const result = await database.execute(
    `SELECT refresh_token_hash, id, user_id, expires_at, ip_address, user_agent, created_at
     FROM sessions_by_token_hash
     WHERE refresh_token_hash = ?`,
    [refreshTokenHash],
    { prepare: true }
  );

  return mapSession(result.first());
}

export async function rotateSessionToken(
  session: StoredSession,
  nextRefreshTokenHash: string,
  nextExpiresAt: Date
) {
  const database = getDatabase();
  const nextSession: StoredSession = {
    ...session,
    refreshTokenHash: nextRefreshTokenHash,
    expiresAt: nextExpiresAt,
  };

  await database.batch(
    [
      {
        query: `INSERT INTO sessions_by_token_hash (
          refresh_token_hash, id, user_id, expires_at, ip_address, user_agent, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        params: [
          nextSession.refreshTokenHash,
          nextSession.id,
          nextSession.userId,
          nextSession.expiresAt,
          nextSession.ipAddress,
          nextSession.userAgent,
          nextSession.createdAt,
        ],
      },
      {
        query: 'DELETE FROM sessions_by_token_hash WHERE refresh_token_hash = ?',
        params: [session.refreshTokenHash],
      },
    ],
    { prepare: true }
  );

  return nextSession;
}

export async function deleteSessionByTokenHash(refreshTokenHash: string) {
  const database = getDatabase();
  await database.execute(
    'DELETE FROM sessions_by_token_hash WHERE refresh_token_hash = ?',
    [refreshTokenHash],
    { prepare: true }
  );
}

async function upsertUser(user: StoredUser) {
  const database = getDatabase();

  await database.batch(
    [
      {
        query: `INSERT INTO users_by_id (
          id, email, password_hash, role, status, failed_login_attempts, last_login, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params: [
          user.id,
          user.email,
          user.passwordHash,
          user.role,
          user.status,
          user.failedLoginAttempts,
          user.lastLogin,
          user.createdAt,
          user.updatedAt,
        ],
      },
      {
        query: `INSERT INTO users_by_email (
          email, id, password_hash, role, status, failed_login_attempts, last_login, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params: [
          user.email,
          user.id,
          user.passwordHash,
          user.role,
          user.status,
          user.failedLoginAttempts,
          user.lastLogin,
          user.createdAt,
          user.updatedAt,
        ],
      },
      {
        query: `INSERT INTO users_by_created (
          bucket, created_at, id, email, password_hash, role, status, failed_login_attempts, last_login, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params: [
          USERS_BUCKET,
          user.createdAt,
          user.id,
          user.email,
          user.passwordHash,
          user.role,
          user.status,
          user.failedLoginAttempts,
          user.lastLogin,
          user.updatedAt,
        ],
      },
    ],
    { prepare: true }
  );
}

function mapUser(row: RowLike | null | undefined): StoredUser | null {
  if (!row) return null;

  return {
    id: String(row.get('id')),
    email: String(row.get('email')),
    passwordHash: String(row.get('password_hash')),
    role: row.get('role') as UserRole,
    status: row.get('status') as UserStatus,
    failedLoginAttempts: Number(row.get('failed_login_attempts') ?? 0),
    lastLogin: (row.get('last_login') as Date | null) ?? null,
    createdAt: row.get('created_at') as Date,
    updatedAt: row.get('updated_at') as Date,
  };
}

function mapSession(row: RowLike | null | undefined): StoredSession | null {
  if (!row) return null;

  return {
    id: String(row.get('id')),
    userId: String(row.get('user_id')),
    refreshTokenHash: String(row.get('refresh_token_hash')),
    expiresAt: row.get('expires_at') as Date,
    ipAddress: (row.get('ip_address') as string | null) ?? null,
    userAgent: (row.get('user_agent') as string | null) ?? null,
    createdAt: row.get('created_at') as Date,
  };
}
