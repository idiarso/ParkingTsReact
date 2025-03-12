import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';

export const initializeSocket = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        throw new Error('Authentication required');
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'default_secret'
      ) as { userId: string; role: string };

      socket.data.userId = decoded.userId;
      socket.data.role = decoded.role;

      next();
    } catch (error) {
      next(new Error('Invalid or expired token'));
    }
  });

  // Handle client connections
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  // Export event emitters for use in controllers
  const emitSessionUpdate = () => {
    io.emit('sessionUpdate');
  };

  const emitVehicleUpdate = () => {
    io.emit('vehicleUpdate');
  };

  return {
    io,
    emitSessionUpdate,
    emitVehicleUpdate
  };
}; 