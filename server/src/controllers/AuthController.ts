import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import { User } from '../entities/User';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { AppDataSource } from '../config/database';

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return next(new AppError(400, 'Username and password are required'));
      }

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { username } });

      if (!user) {
        return next(new AppError(401, 'Invalid credentials'));
      }

      if (!user.isActive) {
        return next(new AppError(403, 'Account has been deactivated'));
      }

      const isPasswordValid = await user.validatePassword(password);
      if (!isPasswordValid) {
        return next(new AppError(401, 'Invalid credentials'));
      }

      // Update last login directly in the database to avoid triggering @BeforeUpdate
      await userRepository
        .createQueryBuilder()
        .update(User)
        .set({
          lastLogin: {
            timestamp: new Date(),
            ip: req.ip || 'unknown'
          }
        })
        .where('id = :id', { id: user.id })
        .execute();

      const secret: Secret = process.env.JWT_SECRET || 'default_secret';
      const options: SignOptions = {
        expiresIn: '24h'
      };

      // Generate token
      const token = jwt.sign(
        { userId: user.id },
        secret,
        options
      );

      return res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          role: user.role
        }
      });
    } catch (error) {
      logger.error('Login error:', error);
      return next(new AppError(500, 'Failed to login'));
    }
  }

  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, username, password, role } = req.body;

      if (!name || !username || !password) {
        return next(new AppError(400, 'Name, username and password are required'));
      }

      const userRepository = AppDataSource.getRepository(User);

      // Check if username is already taken
      const existingUser = await userRepository.findOne({ where: { username } });
      if (existingUser) {
        return next(new AppError(409, 'Username already taken'));
      }

      // Create new user
      const user = userRepository.create({
        name,
        username,
        password,
        role: role || 'operator' // Default role
      });

      await userRepository.save(user);

      return res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          role: user.role
        }
      });
    } catch (error) {
      logger.error('Registration error:', error);
      return next(new AppError(500, 'Failed to register user'));
    }
  }

  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return next(new AppError(401, 'Not authenticated'));
      }

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: req.user.id } });

      if (!user) {
        return next(new AppError(404, 'User not found'));
      }

      return res.json({
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        lastLogin: user.lastLogin
      });
    } catch (error) {
      logger.error('Get current user error:', error);
      return next(new AppError(500, 'Failed to get user info'));
    }
  }

  static async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return next(new AppError(401, 'Not authenticated'));
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return next(new AppError(400, 'Current password and new password are required'));
      }

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: req.user.id } });

      if (!user) {
        return next(new AppError(404, 'User not found'));
      }

      const isPasswordValid = await user.validatePassword(currentPassword);
      if (!isPasswordValid) {
        return next(new AppError(401, 'Invalid current password'));
      }

      user.password = newPassword;
      await userRepository.save(user);

      return res.json({
        message: 'Password changed successfully'
      });
    } catch (error) {
      logger.error('Change password error:', error);
      return next(new AppError(500, 'Failed to change password'));
    }
  }

  // Update user profile
  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return next(new AppError(401, 'Unauthorized'));
      }

      const { name } = req.body;
      if (!name) {
        return next(new AppError(400, 'Name is required'));
      }

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: userId } });
      
      if (!user) {
        return next(new AppError(404, 'User not found'));
      }

      // Update user fields
      user.name = name;
      
      await userRepository.save(user);
      
      // Return updated user without password
      const { password: _, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    } catch (error) {
      logger.error('Error updating profile:', error);
      return next(new AppError(500, 'Failed to update profile'));
    }
  }
} 