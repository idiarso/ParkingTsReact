import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Get dashboard statistics
router.get('/statistics', authenticate, DashboardController.getStatistics);

export default router; 