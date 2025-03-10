import { Express } from 'express';
import vehicleRoutes from './vehicle';
import parkingRoutes from './parking';

export const setupRoutes = (app: Express) => {
  app.use('/api/vehicles', vehicleRoutes);
  app.use('/api/parking', parkingRoutes);
}; 