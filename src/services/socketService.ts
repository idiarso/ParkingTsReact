import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../config/api';

let socket: Socket | null = null;

export const initSocket = () => {
  if (!socket) {
    socket = io(API_BASE_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('Connected to server');
      socket?.emit('register', { type: 'admin' });
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }
  return socket;
};

export const getSocket = () => socket;

export default {
  getSocket,
  initSocket,
}; 