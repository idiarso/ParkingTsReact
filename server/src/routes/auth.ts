import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Public routes
router.post('/login', AuthController.login);
router.post('/register', authMiddleware, AuthController.register);

// Protected routes - require authentication
router.get('/me', authMiddleware, AuthController.getCurrentUser);
router.post('/change-password', authMiddleware, AuthController.changePassword);
router.put('/profile', authMiddleware, AuthController.updateProfile);

export default router; 