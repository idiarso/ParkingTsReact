import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

// Protected routes
router.use(authenticate);

// Get active sessions
router.get('/', (_req, res) => {
  res.json({ message: 'Sessions endpoint' });
});

export default router; 