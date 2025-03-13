import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { logger } from './utils/logger';

let io: Server;

export const initializeSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: [
        'http://localhost:3000',  // Admin
        'http://localhost:3001',  // Gate-In
        'http://localhost:3002',  // Gate-Out
        'http://localhost:3003'   // Additional if needed
      ],
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Track all connected clients
  const connectedClients: Map<string, { type?: 'admin' | 'gate-in' | 'gate-out' }> = new Map();

  // Handle client connections
  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);
    connectedClients.set(socket.id, {});

    // Register client type
    socket.on('register:client', (data: { type: 'admin' | 'gate-in' | 'gate-out' }) => {
      const client = connectedClients.get(socket.id);
      if (client) {
        client.type = data.type;
        logger.info(`Client ${socket.id} registered as: ${data.type}`);
        // Send immediate confirmation back to the client
        socket.emit('register:confirmed', { success: true, type: data.type });
      }
    });

    // Handle gate status updates
    socket.on('gate:status', (data: { gateId: string; status: 'open' | 'closed' }) => {
      io.emit('gate:status:update', data);
      logger.info(`Gate ${data.gateId} status: ${data.status}`);
    });

    // Handle vehicle entry
    socket.on('vehicle:entry', (data: { licensePlate: string; vehicleType: string }) => {
      io.emit('vehicle:entry:update', data);
      logger.info(`Vehicle entered: ${data.licensePlate}, Type: ${data.vehicleType}`);
    });

    // Handle vehicle exit
    socket.on('vehicle:exit', (data: { licensePlate: string; duration: number; fee: number }) => {
      io.emit('vehicle:exit:update', data);
      logger.info(`Vehicle exited: ${data.licensePlate}, Duration: ${data.duration} minutes, Fee: $${data.fee}`);
    });

    // Handle parking space updates
    socket.on('parking:update', (data: { total: number; occupied: number }) => {
      io.emit('parking:status:update', data);
      logger.info(`Parking status update - Total: ${data.total}, Occupied: ${data.occupied}`);
    });

    // Handle client disconnection
    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
      connectedClients.delete(socket.id);
    });

    // Handle ping (for testing connections)
    socket.on('ping', (callback) => {
      logger.debug(`Ping received from ${socket.id}`);
      if (typeof callback === 'function') {
        callback({ time: new Date().toISOString() });
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for client ${socket.id}:`, error);
    });
  });

  // Utility function to get client count
  const getClientCount = () => ({
    total: connectedClients.size,
    admin: Array.from(connectedClients.values()).filter(client => client.type === 'admin').length,
    gateIn: Array.from(connectedClients.values()).filter(client => client.type === 'gate-in').length,
    gateOut: Array.from(connectedClients.values()).filter(client => client.type === 'gate-out').length,
  });

  // Send status updates every minute
  setInterval(() => {
    const status = getClientCount();
    logger.info(`Connected clients: ${JSON.stringify(status)}`);
  }, 60000);

  // Export event emitters for use in controllers
  const emitSessionUpdate = () => {
    io.emit('sessionUpdate');
  };

  const emitVehicleUpdate = () => {
    io.emit('vehicleUpdate');
  };

  return io;
};

export { io }; 