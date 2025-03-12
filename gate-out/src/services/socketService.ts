import { Manager } from 'socket.io-client';
import type { Socket } from 'socket.io-client/build/esm/socket';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isRegistered: boolean = false;

  connect() {
    if (!this.socket) {
      const manager = new Manager(SOCKET_URL, {
        transports: ['websocket'],
        autoConnect: true,
      });

      this.socket = manager.socket('/');

      this.socket.on('connect', () => {
        console.log('Connected to socket server');
        this.registerAsGateOut();
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from socket server');
        this.isRegistered = false;
        this.reconnect();
      });
    }
  }

  private registerAsGateOut() {
    if (!this.socket || this.isRegistered) return;
    
    this.socket.emit('register:client', { type: 'gate-out' });
    this.isRegistered = true;
    console.log('Registered as gate-out client');
  }

  private reconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      console.log('Attempting to reconnect...');
      this.connect();
    }, 5000);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.isRegistered = false;
  }

  notifyVehicleExit(licensePlate: string, duration: number, fee: number) {
    if (!this.socket || !this.isRegistered) {
      console.warn('Socket not connected or not registered, cannot notify vehicle exit');
      return;
    }
    
    this.socket.emit('vehicle:exit', { licensePlate, duration, fee });
    console.log(`Sent vehicle exit notification for ${licensePlate}`);
  }

  updateGateStatus(gateId: string, status: 'open' | 'closed') {
    if (!this.socket || !this.isRegistered) {
      console.warn('Socket not connected or not registered, cannot update gate status');
      return;
    }
    
    this.socket.emit('gate:status:update', { gateId, status });
    console.log(`Sent gate status update for gate ${gateId}: ${status}`);
  }

  emit(event: string, data: any) {
    if (this.socket && this.isRegistered) {
      this.socket.emit(event, data);
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback: (data: any) => void) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  isConnected(): boolean {
    return !!this.socket && this.socket.connected && this.isRegistered;
  }
}

export default new SocketService(); 