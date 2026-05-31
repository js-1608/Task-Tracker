// src/modules/tasks/tasks.routes.ts
import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { validate } from '../../middlewares/validate';
import {
  createTaskSchema,
  updateTaskSchema,
  updateStatusSchema,
  listTasksQuerySchema,
} from './tasks.schema';
import { list, getById, create, update, updateStatus, remove } from './tasks.controller';

const router = Router();

router.use(authenticate);

// All authenticated users can list/read (MEMBER scope enforced in service)
router.get('/', authorize([Role.ADMIN, Role.MANAGER, Role.MEMBER]), validate(listTasksQuerySchema, 'query'), list);
router.get('/:id', authorize([Role.ADMIN, Role.MANAGER, Role.MEMBER]), getById);

// Create and delete are privileged
router.post('/', authorize([Role.ADMIN, Role.MANAGER]), validate(createTaskSchema), create);
router.delete('/:id', authorize([Role.ADMIN]), remove);

// Update (MEMBER can only update own tasks — enforced in service)
router.patch('/:id', authorize([Role.ADMIN, Role.MANAGER, Role.MEMBER]), validate(updateTaskSchema), update);

// Status transition (assignee or MANAGER/ADMIN — enforced in service)
router.patch('/:id/status', authorize([Role.ADMIN, Role.MANAGER, Role.MEMBER]), validate(updateStatusSchema), updateStatus);

export default router;
