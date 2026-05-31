// src/modules/auth/auth.service.ts
import crypto from 'crypto';
import { prisma } from '../../config/db';
import { redis } from '../../config/redis';
import { hashPassword, comparePassword } from '../../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { ApiError } from '../../utils/ApiError';
import { env } from '../../config/env';
import { RegisterInput, LoginInput } from './auth.schema';

// Parse refresh TTL (e.g. "7d" → ms)
function parseTTLMs(ttl: string): number {
  const unit = ttl.slice(-1);
  const value = parseInt(ttl.slice(0, -1), 10);
  const multipliers: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return value * (multipliers[unit] ?? 1000);
}

export async function registerService(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw ApiError.conflict('Email is already registered', 'EMAIL_TAKEN');

  const passwordHash = await hashPassword(input.password);

  // Create org + admin user in one transaction
  const { user, org } = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({ data: { name: input.orgName } });
    const user = await tx.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash,
        role: 'ADMIN',
        orgId: org.id,
      },
    });
    return { user, org };
  });

  const { accessToken, refreshToken } = await issueTokens(user.id, org.id, user.role);

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, orgId: org.id },
  };
}

export async function loginService(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');

  const valid = await comparePassword(input.password, user.passwordHash);
  if (!valid) throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');

  const { accessToken, refreshToken } = await issueTokens(user.id, user.orgId, user.role);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      orgId: user.orgId,
    },
  };
}

export async function refreshService(rawRefreshToken: string) {
  let payload: { userId: string; tokenVersion: number };
  try {
    payload = verifyRefreshToken(rawRefreshToken);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
  }

  const hashed = hashToken(rawRefreshToken);
  const stored = await prisma.refreshToken.findUnique({ where: { token: hashed } });

  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    throw ApiError.unauthorized('Refresh token is invalid or has been revoked', 'INVALID_REFRESH_TOKEN');
  }

  // Rotate: revoke old, issue new
  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });

  const user = await prisma.user.findUniqueOrThrow({ where: { id: payload.userId } });
  const { accessToken, refreshToken } = await issueTokens(user.id, user.orgId, user.role);

  return { accessToken, refreshToken };
}

export async function logoutService(rawRefreshToken: string) {
  const hashed = hashToken(rawRefreshToken);
  await prisma.refreshToken.updateMany({
    where: { token: hashed },
    data: { revoked: true },
  });
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function issueTokens(userId: string, orgId: string, role: string) {
  const accessToken = signAccessToken({ userId, orgId, role });
  const refreshToken = signRefreshToken({ userId, tokenVersion: Date.now() });

  const ttlMs = parseTTLMs(env.JWT_REFRESH_EXPIRES_IN);
  const expiresAt = new Date(Date.now() + ttlMs);
  const hashed = hashToken(refreshToken);

  await prisma.refreshToken.create({
    data: { token: hashed, userId, expiresAt },
  });

  return { accessToken, refreshToken };
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
