import { Request, Response, NextFunction } from 'express';
import { getRepository } from 'typeorm';
import { User } from '../entities/User';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { UserRole } from '../types/auth';

export class UserController {
  // Get all users
  static async getAllUsers(_req: Request, res: Response, next: NextFunction) {
    try {
      const userRepository = getRepository(User);
      const users = await userRepository.find({
        select: ['id', 'name', 'username', 'role', 'isActive', 'lastLogin', 'createdAt']
      });
      
      return res.json(users);
    } catch (error) {
      logger.error('Error fetching users:', error);
      return next(new AppError(500, 'Failed to fetch users'));
    }
  }

  // Get user by ID
  static async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const userRepository = getRepository(User);
      const user = await userRepository.findOne({ 
        where: { id },
        select: ['id', 'name', 'username', 'role', 'isActive', 'lastLogin', 'createdAt']
      });
      
      if (!user) {
        return next(new AppError(404, 'User not found'));
      }
      
      return res.json(user);
    } catch (error) {
      logger.error('Error fetching user:', error);
      return next(new AppError(500, 'Failed to fetch user'));
    }
  }

  // Update user
  static async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, role, password } = req.body;
      
      if (!name && !role && !password) {
        return next(new AppError(400, 'No update data provided'));
      }
      
      const userRepository = getRepository(User);
      
      // Check if user exists
      const user = await userRepository.findOne({ where: { id } });
      if (!user) {
        return next(new AppError(404, 'User not found'));
      }
      
      // Check if current user is trying to update their own role (not allowed)
      if (req.user?.id === id && role && role !== user.role) {
        return next(new AppError(403, 'You cannot change your own role'));
      }
      
      // Update user fields
      if (name) user.name = name;
      if (role) user.role = role as UserRole;
      if (password) user.password = password;
      
      await userRepository.save(user);
      
      // Return updated user without password
      const { password: _, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    } catch (error) {
      logger.error('Error updating user:', error);
      return next(new AppError(500, 'Failed to update user'));
    }
  }

  // Update user active status
  static async updateUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      
      if (isActive === undefined) {
        return next(new AppError(400, 'Active status is required'));
      }
      
      const userRepository = getRepository(User);
      
      // Check if user exists
      const user = await userRepository.findOne({ where: { id } });
      if (!user) {
        return next(new AppError(404, 'User not found'));
      }
      
      // Prevent self-deactivation
      if (req.user?.id === id) {
        return next(new AppError(403, 'You cannot change your own active status'));
      }
      
      user.isActive = isActive;
      await userRepository.save(user);
      
      return res.json({
        id: user.id,
        isActive: user.isActive,
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error) {
      logger.error('Error updating user status:', error);
      return next(new AppError(500, 'Failed to update user status'));
    }
  }

  // Delete user (soft delete by setting isActive to false)
  static async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const userRepository = getRepository(User);
      
      // Check if user exists
      const user = await userRepository.findOne({ where: { id } });
      if (!user) {
        return next(new AppError(404, 'User not found'));
      }
      
      // Prevent self-deletion
      if (req.user?.id === id) {
        return next(new AppError(403, 'You cannot delete your own account'));
      }
      
      // Soft delete by setting isActive to false
      user.isActive = false;
      await userRepository.save(user);
      
      return res.status(200).json({
        message: 'User deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting user:', error);
      return next(new AppError(500, 'Failed to delete user'));
    }
  }
} 