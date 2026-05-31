// src/middlewares/authorize.ts
import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { ApiError } from '../utils/ApiError';

/**
 * RBAC enforcement at the middleware layer.
 * Controllers never check roles — only this middleware does.
 *
 * Usage:
 *   router.get('/', authenticate, authorize([Role.ADMIN, Role.MANAGER]), controller)
 */
export function authorize(allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Role '${req.user.role}' is not permitted to access this resource. Required: [${allowedRoles.join(', ')}]`,
          'INSUFFICIENT_PERMISSIONS',
        ),
      );
    }

    next();
  };
}
