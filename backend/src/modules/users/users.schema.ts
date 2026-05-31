// src/modules/users/users.schema.ts
import { z } from 'zod';
import { Role } from '../../models/User';

export const updateRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MANAGER', 'MEMBER'] as [Role, ...Role[]], {
    error: 'Role must be ADMIN, MANAGER, or MEMBER',
  }),
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
