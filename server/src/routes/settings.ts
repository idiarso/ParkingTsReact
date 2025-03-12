import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

// Protected routes
router.use(authenticate);

// Get settings
router.get('/', (_req, res) => {
  res.json({ message: 'Settings endpoint' });
});

export default router; 