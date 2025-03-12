import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/login', AuthController.login);

// Protected routes - require authentication
router.post('/logout', authenticate, AuthController.logout);
router.post('/register', authenticate, AuthController.register);
router.get('/me', authenticate, AuthController.me);
router.post('/change-password', authenticate, AuthController.changePassword);
router.put('/profile', authenticate, AuthController.updateProfile);

export default router; 