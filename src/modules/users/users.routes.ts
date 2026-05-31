// src/modules/users/users.routes.ts
import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { validate } from '../../middlewares/validate';
import { updateRoleSchema } from './users.schema';
import { list, getById, updateRole, remove } from './users.controller';

const router = Router();

// All users routes require authentication
router.use(authenticate);

router.get('/', authorize([Role.ADMIN]), list);
router.get('/:id', authorize([Role.ADMIN, Role.MANAGER]), getById);
router.patch('/:id/role', authorize([Role.ADMIN]), validate(updateRoleSchema), updateRole);
router.delete('/:id', authorize([Role.ADMIN]), remove);

export default router;
