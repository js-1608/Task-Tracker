// src/modules/users/users.schema.ts
import { z } from 'zod';
import { Role } from '@prisma/client';

export const updateRoleSchema = z.object({
  // Zod v4: use 'error' instead of 'errorMap' for custom error messages
  role: z.nativeEnum(Role, { error: 'Role must be ADMIN, MANAGER, or MEMBER' }),
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
