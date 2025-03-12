import { User } from '../entities/User';

declare global {
  namespace Express {
    export interface Request {
      user?: User;
      token?: string;
    }
  }
}

// This file is a module
export {}; 