import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/login', AuthController.login);
router.post('/register-initial-admin', AuthController.register);

// Protected routes - require authentication
router.use(authenticate);
router.post('/logout', AuthController.logout);
router.get('/me', AuthController.me);
router.post('/change-password', AuthController.changePassword);
router.put('/profile', AuthController.updateProfile);

export default router; 