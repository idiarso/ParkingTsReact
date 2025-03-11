import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authMiddleware } from '../middleware/authMiddleware';
import { checkRole } from '../middleware/checkRoleMiddleware';
import { UserRole } from '../types/auth';

const router = Router();

// Apply auth middleware to all user routes
router.use(authMiddleware);

// Get all users - Only admin and superadmin can access
router.get('/', checkRole([UserRole.ADMIN, UserRole.SUPERADMIN]), UserController.getAllUsers);

// Get user by ID - Only admin and superadmin can access
router.get('/:id', checkRole([UserRole.ADMIN, UserRole.SUPERADMIN]), UserController.getUserById);

// Update user - Only admin and superadmin can access
router.put('/:id', checkRole([UserRole.ADMIN, UserRole.SUPERADMIN]), UserController.updateUser);

// Update user status - Only admin and superadmin can access
router.patch('/:id/status', checkRole([UserRole.ADMIN, UserRole.SUPERADMIN]), UserController.updateUserStatus);

// Delete user - Only superadmin can access
router.delete('/:id', checkRole([UserRole.SUPERADMIN]), UserController.deleteUser);

export default router; 