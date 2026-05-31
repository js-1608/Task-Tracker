// src/modules/tasks/tasks.schema.ts
import { z } from 'zod';
import { Priority, TaskStatus } from '@prisma/client';

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(5000).optional(),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  assigneeId: z.string().uuid('assigneeId must be a valid UUID').optional(),
  projectId: z.string().uuid('projectId must be a valid UUID'),
  dueDate: z
    .string()
    .datetime({ message: 'dueDate must be a valid ISO 8601 datetime' })
    .optional()
    .refine(
      (date) => !date || new Date(date) > new Date(),
      'due_date must be a future date',
    ),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).optional(),
  priority: z.nativeEnum(Priority).optional(),
  assigneeId: z.string().uuid().optional().nullable(),
  dueDate: z
    .string()
    .datetime()
    .optional()
    .nullable()
    .refine(
      (date) => !date || new Date(date) > new Date(),
      'due_date must be a future date',
    ),
});

export const updateStatusSchema = z.object({
  // Zod v4: use 'error' string (not errorMap object)
  status: z.nativeEnum(TaskStatus, {
    error: 'status must be one of: TODO, IN_PROGRESS, IN_REVIEW, DONE, BLOCKED',
  }),
});

export const listTasksQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
  assigneeId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
