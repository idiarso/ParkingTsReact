import { DataSource } from 'typeorm';
import { ParkingSession } from '../entities/ParkingSession';
import { ParkingRate } from '../entities/ParkingRate';
import { User } from '../entities/User';
import { logger } from '../utils/logger';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'parking_system',
  synchronize: process.env.NODE_ENV !== 'production',
  logging: true,
  ssl: false,
  extra: {
    max: 25,
    connectionTimeoutMillis: 10000,
    options: `--client_encoding=UTF8`
  },
  entities: [User, ParkingSession, ParkingRate],
  migrations: [],
  subscribers: []
});

export const setupDatabase = async () => {
  try {
    logger.info('Attempting to connect to database with config:', {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || '5432',
      username: process.env.DB_USERNAME || 'postgres',
      database: process.env.DB_NAME || 'parking_system'
    });
    await AppDataSource.initialize();
    logger.info('Database connection initialized');
  } catch (error) {
    logger.error('Error initializing database:', error);
    throw error;
  }
}; 