// src/modules/tasks/tasks.service.ts
import { prisma } from '../../config/db';
import { ApiError } from '../../utils/ApiError';
import { TaskStatus, Role } from '@prisma/client';
import {
  cacheGet,
  cacheSet,
  cacheDel,
  CacheKeys,
  invalidateOrgTaskCache,
  invalidateAssigneeTaskCache,
} from '../../utils/cache';
import {
  CreateTaskInput,
  UpdateTaskInput,
  UpdateStatusInput,
  ListTasksQuery,
} from './tasks.schema';

// ─── Status Transition Machine ────────────────────────────────────────────────
const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  [TaskStatus.TODO]: [TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED],
  [TaskStatus.IN_PROGRESS]: [TaskStatus.IN_REVIEW, TaskStatus.BLOCKED],
  [TaskStatus.IN_REVIEW]: [TaskStatus.DONE, TaskStatus.BLOCKED],
  [TaskStatus.DONE]: [],
  [TaskStatus.BLOCKED]: [TaskStatus.TODO, TaskStatus.IN_PROGRESS],
};

const TASK_SELECT = {
  id: true,
  title: true,
  description: true,
  priority: true,
  status: true,
  dueDate: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
  assignee: { select: { id: true, name: true, email: true } },
  project: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
};

// ─── List Tasks ───────────────────────────────────────────────────────────────
export async function listTasks(
  requesterId: string,
  requesterRole: Role,
  orgId: string,
  query: ListTasksQuery,
) {
  const { page, limit, status, priority, assigneeId, projectId } = query;

  // MEMBER can only see their own assigned tasks
  const effectiveAssigneeId =
    requesterRole === Role.MEMBER ? requesterId : assigneeId;

  const cacheKey = CacheKeys.taskList(
    orgId,
    effectiveAssigneeId,
    page,
    limit,
    `${status ?? ''}-${priority ?? ''}-${projectId ?? ''}`,
  );

  const cached = await cacheGet<{ tasks: unknown[]; total: number; page: number; limit: number }>(cacheKey);
  if (cached) return cached;

  const where = {
    orgId,
    ...(effectiveAssigneeId && { assigneeId: effectiveAssigneeId }),
    ...(status && { status }),
    ...(priority && { priority }),
    ...(projectId && { projectId }),
  };

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      select: TASK_SELECT,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.task.count({ where }),
  ]);

  const result = { tasks, total, page, limit, totalPages: Math.ceil(total / limit) };
  await cacheSet(cacheKey, result, 300);

  return result;
}

// ─── Get Task ─────────────────────────────────────────────────────────────────
export async function getTaskById(taskId: string, orgId: string, requesterId: string, role: Role) {
  const cacheKey = CacheKeys.task(taskId);
  const cached = await cacheGet<unknown>(cacheKey);
  if (cached) {
    // MEMBER visibility check even for cached
    const t = cached as { assignee?: { id: string } };
    if (role === Role.MEMBER && t.assignee?.id !== requesterId) {
      throw ApiError.forbidden('You can only view your own tasks');
    }
    return cached;
  }

  const task = await prisma.task.findFirst({ where: { id: taskId, orgId }, select: TASK_SELECT });
  if (!task) throw ApiError.notFound(`Task ${taskId} not found`);

  if (role === Role.MEMBER && task.assignee?.id !== requesterId) {
    throw ApiError.forbidden('You can only view your own tasks');
  }

  await cacheSet(cacheKey, task, 600);
  return task;
}

// ─── Create Task ──────────────────────────────────────────────────────────────
export async function createTask(orgId: string, userId: string, input: CreateTaskInput) {
  // Validate project belongs to org
  const project = await prisma.project.findFirst({ where: { id: input.projectId, orgId } });
  if (!project) throw ApiError.notFound(`Project ${input.projectId} not found in your organization`);

  // Validate assignee belongs to org
  if (input.assigneeId) {
    const assignee = await prisma.user.findFirst({ where: { id: input.assigneeId, orgId } });
    if (!assignee) throw ApiError.notFound(`User ${input.assigneeId} not found in your organization`);
  }

  const task = await prisma.task.create({
    data: {
      title: input.title,
      description: input.description,
      priority: input.priority,
      assigneeId: input.assigneeId,
      projectId: input.projectId,
      orgId,
      createdById: userId,
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
    },
    select: TASK_SELECT,
  });

  // Invalidate list caches for org + assignee
  await invalidateOrgTaskCache(orgId);

  return task;
}

// ─── Update Task ──────────────────────────────────────────────────────────────
export async function updateTask(
  taskId: string,
  orgId: string,
  requesterId: string,
  role: Role,
  input: UpdateTaskInput,
) {
  const task = await prisma.task.findFirst({ where: { id: taskId, orgId } });
  if (!task) throw ApiError.notFound(`Task ${taskId} not found`);

  // MEMBER can only update their own tasks
  if (role === Role.MEMBER && task.assigneeId !== requesterId) {
    throw ApiError.forbidden('You can only update tasks assigned to you');
  }

  // Validate new assignee belongs to org
  if (input.assigneeId) {
    const assignee = await prisma.user.findFirst({ where: { id: input.assigneeId, orgId } });
    if (!assignee) throw ApiError.notFound(`User ${input.assigneeId} not found in your organization`);
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...input,
      dueDate: input.dueDate ? new Date(input.dueDate) : input.dueDate === null ? null : undefined,
    },
    select: TASK_SELECT,
  });

  // Invalidate caches
  await cacheDel(CacheKeys.task(taskId));
  await invalidateOrgTaskCache(orgId);
  if (task.assigneeId) await invalidateAssigneeTaskCache(orgId, task.assigneeId);
  if (input.assigneeId && input.assigneeId !== task.assigneeId) {
    await invalidateAssigneeTaskCache(orgId, input.assigneeId);
  }

  return updated;
}

// ─── Update Status ────────────────────────────────────────────────────────────
export async function updateTaskStatus(
  taskId: string,
  orgId: string,
  requesterId: string,
  role: Role,
  input: UpdateStatusInput,
) {
  const task = await prisma.task.findFirst({ where: { id: taskId, orgId } });
  if (!task) throw ApiError.notFound(`Task ${taskId} not found`);

  // Only assignee, MANAGER, or ADMIN can advance status
  const isAssignee = task.assigneeId === requesterId;
  const isPrivileged = role === Role.MANAGER || role === Role.ADMIN;
  if (!isAssignee && !isPrivileged) {
    throw ApiError.forbidden('Only the assignee, a MANAGER, or ADMIN can change task status');
  }

  const allowed = VALID_TRANSITIONS[task.status];
  if (!allowed.includes(input.status)) {
    throw ApiError.badRequest(
      `Invalid status transition: ${task.status} → ${input.status}. Allowed: [${allowed.join(', ')}]`,
      'INVALID_STATUS_TRANSITION',
    );
  }

  const isCompleting = input.status === TaskStatus.DONE;

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      status: input.status,
      ...(isCompleting && { completedAt: new Date() }),
    },
    select: TASK_SELECT,
  });

  // Invalidate caches
  await cacheDel(CacheKeys.task(taskId));
  await invalidateOrgTaskCache(orgId);
  if (task.assigneeId) await invalidateAssigneeTaskCache(orgId, task.assigneeId);

  return updated;
}

// ─── Delete Task ──────────────────────────────────────────────────────────────
export async function deleteTask(taskId: string, orgId: string) {
  const task = await prisma.task.findFirst({ where: { id: taskId, orgId } });
  if (!task) throw ApiError.notFound(`Task ${taskId} not found`);

  await prisma.task.delete({ where: { id: taskId } });

  await cacheDel(CacheKeys.task(taskId));
  await invalidateOrgTaskCache(orgId);
  if (task.assigneeId) await invalidateAssigneeTaskCache(orgId, task.assigneeId);
}
