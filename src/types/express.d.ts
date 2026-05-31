// src/types/express.d.ts
import { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        orgId: string;
        role: Role;
      };
    }
  }
}
