import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import { User } from '../entities';
import { UserRole } from '../types/auth';
import { tokenBlacklist } from '../utils/tokenBlacklist';

interface JwtPayload {
  userId: string;
  role: string;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
      token?: string;
    }
  }
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new AppError(401, 'Authentication required');
    }

    // Check if token is blacklisted
    if (tokenBlacklist.isBlacklisted(token)) {
      throw new AppError(401, 'Token has been invalidated');
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'default_secret'
    ) as JwtPayload;

    // Store token in request for logout
    req.token = token;

    // Add user info to request
    req.user = {
      id: decoded.userId,
      role: decoded.role
    } as User;

    next();
  } catch (error) {
    next(new AppError(401, 'Invalid or expired token'));
  }
};

export const authorize = (roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'Authentication required'));
    }

    if (!roles.includes(req.user.role as UserRole)) {
      return next(new AppError(403, 'Insufficient permissions'));
    }

    next();
  };
}; 