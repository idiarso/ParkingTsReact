import { Manager } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
const IS_DEV = process.env.NODE_ENV === 'development';

console.log('Environment:', {
  SOCKET_URL,
  IS_DEV,
  NODE_ENV: process.env.NODE_ENV
});

class SocketService {
  private socket: any = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isRegistered: boolean = false;
  private connectionChangeCallbacks: ((connected: boolean) => void)[] = [];
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;

  connect() {
    if (!this.socket) {
      try {
        console.log('Attempting to connect to socket server at:', SOCKET_URL);
        
        const manager = new Manager(SOCKET_URL, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 2000,
          timeout: 10000,
          autoConnect: true
        });

        this.socket = manager.socket('/');

        this.socket.on('connect', () => {
          console.log('Connected to socket server');
          this.reconnectAttempts = 0;
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
          console.error('Socket connection error:', error.message);
          this.notifyConnectionChange(false);
          this.reconnect();
        });

        this.socket.on('error', (error: any) => {
          console.error('Socket error:', error);
          this.notifyConnectionChange(false);
        });
      } catch (error) {
        console.error('Failed to initialize socket:', error);
        this.reconnect();
      }
    }
  }

  private registerAsGateIn() {
    if (!this.socket || this.isRegistered) return;
    
    try {
      console.log('Registering as gate-in client...');
      this.socket.emit('register:client', { type: 'gate-in' });
      this.isRegistered = true;
      console.log('Successfully registered as gate-in client');
    } catch (error) {
      console.error('Failed to register as gate-in:', error);
      this.isRegistered = false;
      this.reconnect();
    }
  }

  private reconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached. Please check server status.');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

    this.reconnectTimer = setTimeout(() => {
      console.log('Attempting to reconnect...');
      if (this.socket) {
        this.socket.connect();
      } else {
        this.connect();
      }
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
    this.reconnectAttempts = 0;
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