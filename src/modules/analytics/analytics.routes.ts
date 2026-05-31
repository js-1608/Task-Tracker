// src/modules/analytics/analytics.routes.ts
import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { overdueStats } from './analytics.controller';

const router = Router();

router.use(authenticate);
router.get('/overdue', authorize([Role.ADMIN, Role.MANAGER]), overdueStats);

export default router;
