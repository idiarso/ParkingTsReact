import { Server } from 'socket.io';
import { logger } from '../utils/logger';

export const setupSocketHandlers = (io: Server) => {
  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Handle gate status updates
    socket.on('gate:status', (data: { gateId: string; status: 'open' | 'closed' }) => {
      io.emit('gate:status:update', data);
      logger.info(`Gate ${data.gateId} status: ${data.status}`);
    });

    // Handle vehicle entry
    socket.on('vehicle:entry', (data: { licensePlate: string; vehicleType: string }) => {
      io.emit('vehicle:entry:update', data);
      logger.info(`Vehicle entered: ${data.licensePlate}`);
    });

    // Handle vehicle exit
    socket.on('vehicle:exit', (data: { licensePlate: string; duration: number; fee: number }) => {
      io.emit('vehicle:exit:update', data);
      logger.info(`Vehicle exited: ${data.licensePlate}`);
    });

    // Handle parking space updates
    socket.on('parking:update', (data: { total: number; occupied: number }) => {
      io.emit('parking:status:update', data);
      logger.info(`Parking status update - Total: ${data.total}, Occupied: ${data.occupied}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });
}; 