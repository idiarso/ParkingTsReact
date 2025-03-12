import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';
import { setupDatabase } from './config/database';
import { initializeSocket } from './socket';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route
app.get('/', (_req, res) => {
  res.json({
    message: 'Welcome to the Parking System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      vehicles: '/api/vehicles',
      sessions: '/api/sessions',
      settings: '/api/settings',
      users: '/api/users'
    }
  });
});

// Setup routes
app.use('/api', routes);

// Setup socket handlers
initializeSocket(httpServer);

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to database
    await setupDatabase();

    // Start server
    httpServer.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 