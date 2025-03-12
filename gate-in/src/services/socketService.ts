import { Manager } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  private socket: any = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isRegistered: boolean = false;
  private connectionChangeCallbacks: ((connected: boolean) => void)[] = [];

  connect() {
    if (!this.socket) {
      try {
        const manager = new Manager(SOCKET_URL, {
          transports: ['websocket'],
          autoConnect: true,
        });

        this.socket = manager.socket('/');

        this.socket.on('connect', () => {
          console.log('Connected to socket server');
          this.registerAsGateIn();
          this.notifyConnectionChange(true);
        });

        this.socket.on('disconnect', () => {
          console.log('Disconnected from socket server');
          this.isRegistered = false;
          this.notifyConnectionChange(false);
          this.reconnect();
        });

        this.socket.on('connect_error', (error: any) => {
          console.error('Socket connection error:', error);
          this.notifyConnectionChange(false);
        });
      } catch (error) {
        console.error('Failed to initialize socket:', error);
      }
    }
  }

  private registerAsGateIn() {
    if (!this.socket || this.isRegistered) return;
    
    this.socket.emit('register:client', { type: 'gate-in' });
    this.isRegistered = true;
    console.log('Registered as gate-in client');
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

  notifyVehicleEntry(data: { 
    ticketId: string; 
    licensePlate: string; 
    vehicleType: string;
    entryTime: string;
  }) {
    if (!this.socket || !this.isRegistered) {
      console.warn('Socket not connected or not registered, cannot notify vehicle entry');
      return;
    }
    
    this.socket.emit('vehicle:entry', data);
    console.log(`Sent vehicle entry notification for ${data.licensePlate}`);
  }

  updateGateStatus(gateId: string, status: 'open' | 'closed') {
    if (!this.socket || !this.isRegistered) {
      console.warn('Socket not connected or not registered, cannot update gate status');
      return;
    }
    
    this.socket.emit('gate:status:update', { gateId, status });
    console.log(`Sent gate status update for gate ${gateId}: ${status}`);
  }

  onConnectionChange(callback: (connected: boolean) => void) {
    if (typeof callback !== 'function') {
      console.error('onConnectionChange requires a function callback');
      return;
    }
    this.connectionChangeCallbacks.push(callback);
    // Immediately call with current status
    callback(this.isConnected());
  }

  private notifyConnectionChange(connected: boolean) {
    for (const callback of this.connectionChangeCallbacks) {
      if (typeof callback === 'function') {
        try {
          callback(connected);
        } catch (error) {
          console.error('Error in connection change callback:', error);
        }
      }
    }
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

// Create a singleton instance
const socketServiceInstance = new SocketService();

// Export the singleton instance
export default socketServiceInstance; 