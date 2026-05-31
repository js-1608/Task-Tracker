// src/modules/users/users.service.ts
import { prisma } from '../../config/db';
import { ApiError } from '../../utils/ApiError';
import { Role } from '@prisma/client';
import { invalidateOrgTaskCache } from '../../utils/cache';

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  orgId: true,
  createdAt: true,
};

export async function listUsers(orgId: string) {
  return prisma.user.findMany({
    where: { orgId },
    select: USER_SELECT,
    orderBy: { createdAt: 'asc' },
  });
}

export async function getUserById(orgId: string, userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, orgId },
    select: USER_SELECT,
  });
  if (!user) throw ApiError.notFound(`User ${userId} not found in your organization`);
  return user;
}

export async function updateUserRole(orgId: string, targetUserId: string, role: Role, requesterId: string) {
  if (targetUserId === requesterId) {
    throw ApiError.badRequest('You cannot change your own role', 'SELF_ROLE_CHANGE');
  }

  const user = await prisma.user.findFirst({ where: { id: targetUserId, orgId } });
  if (!user) throw ApiError.notFound(`User ${targetUserId} not found in your organization`);

  return prisma.user.update({
    where: { id: targetUserId },
    data: { role },
    select: USER_SELECT,
  });
}

export async function deleteUser(orgId: string, targetUserId: string, requesterId: string) {
  if (targetUserId === requesterId) {
    throw ApiError.badRequest('You cannot remove yourself', 'SELF_DELETE');
  }

  const user = await prisma.user.findFirst({ where: { id: targetUserId, orgId } });
  if (!user) throw ApiError.notFound(`User ${targetUserId} not found in your organization`);

  await prisma.user.delete({ where: { id: targetUserId } });

  // Invalidate task caches for the removed user
  await invalidateOrgTaskCache(orgId);
}
