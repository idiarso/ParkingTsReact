import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import { User } from '../entities/User';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { AppDataSource } from '../config/database';
import { tokenBlacklist } from '../utils/tokenBlacklist';
import { DeepPartial } from 'typeorm';
import bcrypt from 'bcryptjs';
import 'express';  // Ensure Express types are loaded

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
        logger.debug('Login failed: User not found', { username });
        return next(new AppError(401, 'Invalid credentials'));
      }

      if (!user.isActive) {
        logger.debug('Login failed: Account inactive', { username });
        return next(new AppError(403, 'Account has been deactivated'));
      }

      // Debug log for password validation
      logger.debug('Attempting password validation', {
        username,
        hashedPassword: user.password,
        passwordStartsWith: user.password.substring(0, 7)
      });

      const isPasswordValid = await user.validatePassword(password);
      
      // Debug log for validation result
      logger.debug('Password validation result', {
        username,
        isValid: isPasswordValid
      });

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

      // Generate token with user ID and role
      const token = jwt.sign(
        { 
          userId: user.id,
          role: user.role 
        },
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
      const { name, username, password, role, secretKey } = req.body;

      if (!name || !username || !password) {
        return next(new AppError(400, 'Name, username and password are required'));
      }
      
      // Para el registro inicial de admin, verificamos una clave secreta
      if (role === 'admin') {
        // La clave secreta puede ser definida como una variable de entorno o configuración
        // Para simplificar, usamos una clave hardcodeada (debe cambiarse en producción)
        const validSecretKey = process.env.ADMIN_SECRET_KEY || 'admin-setup-key-2024';
        
        if (!secretKey || secretKey !== validSecretKey) {
          return next(new AppError(403, 'Invalid secret key for admin registration'));
        }
        
        // Verificar si ya existe un admin en el sistema
        const userRepository = AppDataSource.getRepository(User);
        const existingAdmin = await userRepository.findOne({ where: { role: 'admin' } });
        
        if (existingAdmin && req.path === '/register-initial-admin') {
          return next(new AppError(409, 'An admin user already exists'));
        }
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
        role: role || 'operator', // Default role
        isActive: true
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

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update user data
      const updateData: DeepPartial<User> = {
        password: hashedPassword
      };

      // Update the password directly in the database
      await userRepository
        .createQueryBuilder()
        .update(User)
        .set(updateData)
        .where('id = :id', { id: user.id })
        .execute();

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

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.token;
      
      if (!token) {
        return next(new AppError(400, 'No token provided'));
      }

      // Get token expiration time from JWT
      const decoded = jwt.decode(token) as { exp?: number };
      if (decoded.exp) {
        // Add token to blacklist with expiration time
        tokenBlacklist.add(token, decoded.exp * 1000); // Convert to milliseconds
      }

      // Update last logout in database
      if (req.user?.id) {
        const userRepository = AppDataSource.getRepository(User);
        const lastLoginData: DeepPartial<User> = {
          lastLogin: {
            timestamp: new Date(),
            ip: req.ip || 'unknown',
            action: 'logout'
          }
        };

        await userRepository
          .createQueryBuilder()
          .update(User)
          .set(lastLoginData)
          .where('id = :id', { id: req.user.id })
          .execute();
      }

      return res.json({ message: 'Successfully logged out' });
    } catch (error) {
      logger.error('Logout error:', error);
      return next(new AppError(500, 'Failed to logout'));
    }
  }
} 