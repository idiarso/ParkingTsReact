import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler';
import { setupDatabase } from './config/database';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import vehicleRoutes from './routes/vehicles';
import sessionRoutes from './routes/sessions';
import settingsRoutes from './routes/settings';
import dashboardRoutes from './routes/dashboard';
import { logger } from './utils/logger';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Error handling
app.use(errorHandler);

// Database setup
setupDatabase()
  .then(() => {
    logger.info('Database setup completed');
  })
  .catch((error) => {
    logger.error('Database setup failed:', error);
    process.exit(1);
  });

export default app; 