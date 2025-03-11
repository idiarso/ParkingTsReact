import { Router } from 'express';
import authRoutes from './auth';
import vehicleRoutes from './vehicles';
import sessionRoutes from './sessions';
import settingsRoutes from './settings';
import userRoutes from './users';

const router = Router();

// Register routes
router.use('/auth', authRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/sessions', sessionRoutes);
router.use('/settings', settingsRoutes);
router.use('/users', userRoutes);

export default router; 