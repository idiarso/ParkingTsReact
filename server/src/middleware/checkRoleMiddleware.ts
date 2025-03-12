import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import { UserRole } from '../types/auth';

// Middleware to check if user has required role
export const checkRole = (roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'Unauthorized - No user found in request'));
    }

    const userRole = req.user.role as UserRole;
    
    if (!roles.includes(userRole)) {
      return next(new AppError(403, 'Forbidden - You do not have permission to access this resource'));
    }
    
    next();
  };
}; 