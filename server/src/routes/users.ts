import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authenticate } from '../middleware/auth';
import { checkRole } from '../middleware/checkRoleMiddleware';
import { UserRole } from '../types/auth';

const router = Router();

// Apply auth middleware to all user routes
router.use(authenticate);

// Create user - Only admin can access
router.post('/', checkRole([UserRole.ADMIN]), UserController.createUser);

// Get all users - Only admin can access
router.get('/', checkRole([UserRole.ADMIN]), UserController.getAllUsers);

// Get user by ID - Only admin can access
router.get('/:id', checkRole([UserRole.ADMIN]), UserController.getUserById);

// Update user - Only admin can access
router.put('/:id', checkRole([UserRole.ADMIN]), UserController.updateUser);

// Update user status - Only admin can access
router.patch('/:id/status', checkRole([UserRole.ADMIN]), UserController.updateUserStatus);

// Delete user - Only admin can access
router.delete('/:id', checkRole([UserRole.ADMIN]), UserController.deleteUser);

export default router; 