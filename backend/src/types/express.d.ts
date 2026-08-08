/**
 * Express type augmentation — gives `req.user` a safe type everywhere after
 * the `authenticate` middleware has run.
 */
import { Role } from './enums';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: Role;
        email?: string;
      };
    }
  }
}

export {};
