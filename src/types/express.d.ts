// src/types/express.d.ts
import { Role } from '../models/User';

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
