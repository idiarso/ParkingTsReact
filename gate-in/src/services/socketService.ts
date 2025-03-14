// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Manager } from 'socket.io-client';
import io, { Socket as SocketIO } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
const IS_DEV = process.env.NODE_ENV === 'development';

console.log('Environment:', {
  SOCKET_URL,
  IS_DEV,
  NODE_ENV: process.env.NODE_ENV
});

class SocketService {
  private socket: ReturnType<typeof io> | null = null;
  private isInitialized = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isRegistered: boolean = false;
  private connectionChangeCallbacks: ((connected: boolean) => void)[] = [];
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private initPromise: Promise<void> | null = null;

  async initialize(serverUrl: string = SOCKET_URL): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      if (this.isInitialized && this.socket?.connected) {
        console.log('Socket service already initialized and connected');
        resolve();
        return;
      }
      
      console.log(`Initializing socket connection to: ${serverUrl}`);
      
      try {
        this.socket = io(serverUrl, {
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 10000,
          transports: ['websocket', 'polling']
        });
        
        // Set up connection promise
        const connectionPromise = new Promise<void>((connResolve, connReject) => {
          const timeoutId = setTimeout(() => {
            connReject(new Error('Socket connection timeout'));
          }, 10000);

          this.socket!.once('connect', () => {
            clearTimeout(timeoutId);
            console.log('Socket connected successfully', this.socket?.id);
            this.reconnectAttempts = 0;
            this.isInitialized = true;
            this.registerAsGateIn();
            this.notifyConnectionChange(true);
            connResolve();
          });

          this.socket!.once('connect_error', (error: Error) => {
            clearTimeout(timeoutId);
            console.error('Socket connection error:', error);
            this.notifyConnectionChange(false);
            connReject(error);
          });
        });

        // Set up permanent event listeners
        this.socket.on('disconnect', (reason: string) => {
          console.log('Socket disconnected:', reason);
          this.isRegistered = false;
          this.notifyConnectionChange(false);
          this.reconnect();
        });

        // Wait for connection
        connectionPromise
          .then(() => resolve())
          .catch((error) => {
            this.reconnect();
            reject(error);
          });

      } catch (error) {
        console.error('Failed to initialize socket:', error);
        this.reconnect();
        reject(error);
      }
    });

    return this.initPromise;
  }

  private async registerAsGateIn(): Promise<void> {
    if (!this.socket || this.isRegistered) return;
    
    try {
      console.log('Registering as gate-in client...');
      return new Promise<void>((resolve, reject) => {
        if (!this.socket) {
          reject(new Error('Socket not initialized'));
          return;
        }

        const timeoutId = setTimeout(() => {
          reject(new Error('Registration timeout'));
        }, 5000);

        this.socket.emit('register:client', { type: 'gate-in' });
        
        this.socket.once('register:success', () => {
          clearTimeout(timeoutId);
          this.isRegistered = true;
          console.log('Successfully registered as gate-in client');
          resolve();
        });

        this.socket.once('register:error', (error: Error) => {
          clearTimeout(timeoutId);
          this.isRegistered = false;
          console.error('Failed to register as gate-in:', error);
          reject(error);
        });
      });
    } catch (error) {
      console.error('Failed to register as gate-in:', error);
      this.isRegistered = false;
      this.reconnect();
      throw error;
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
        this.initialize();
      }
    }, 5000);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isInitialized = false;
      this.isRegistered = false;
      this.reconnectAttempts = 0;
      console.log('Socket disconnected manually');
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
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

  emit(event: string, data: any): void {
    if (!this.socket) {
      console.warn(`Cannot emit ${event} - socket not initialized`);
      return;
    }
    
    if (!this.socket.connected) {
      console.warn(`Cannot emit ${event} - socket not connected`);
      return;
    }
    
    console.log(`Emitting ${event} event:`, data);
    this.socket.emit(event, data);
  }

  on(event: string, callback: (data: any) => void): void {
    if (!this.socket) {
      console.warn(`Cannot listen for ${event} - socket not initialized`);
      // Queue the callback to be added once socket is initialized
      const queuedCallback = () => {
        if (this.socket) {
          this.socket.on(event, callback);
        }
      };
      this.connectionChangeCallbacks.push(() => queuedCallback());
      return;
    }
    
    console.log(`Adding listener for ${event} event`);
    this.socket.on(event, callback);
  }

  off(event: string, callback?: (data: any) => void): void {
    if (!this.socket) {
      return;
    }
    
    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
    console.log(`Removed listener(s) for ${event} event`);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Create a singleton instance
const socketServiceInstance = new SocketService();

// Export the singleton instance
export default socketServiceInstance; 