// src/modules/projects/projects.routes.ts
import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { validate } from '../../middlewares/validate';
import { createProjectSchema, updateProjectSchema } from './projects.schema';
import { list, getById, create, update, remove } from './projects.controller';

const router = Router();

router.use(authenticate);

router.get('/', authorize([Role.ADMIN, Role.MANAGER, Role.MEMBER]), list);
router.get('/:id', authorize([Role.ADMIN, Role.MANAGER, Role.MEMBER]), getById);
router.post('/', authorize([Role.ADMIN, Role.MANAGER]), validate(createProjectSchema), create);
router.patch('/:id', authorize([Role.ADMIN, Role.MANAGER]), validate(updateProjectSchema), update);
router.delete('/:id', authorize([Role.ADMIN]), remove);

export default router;
