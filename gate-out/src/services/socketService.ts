import { Manager } from 'socket.io-client';

class SocketService {
  private socket: any = null;
  private isRegistered = false;
  private connectionChangeCallbacks: ((connected: boolean) => void)[] = [];

  // Connect to socket server
  connect() {
    try {
      const manager = new Manager('http://localhost:3001', {
        reconnectionDelayMax: 10000,
        timeout: 20000,
        autoConnect: true
      });

      this.socket = manager.socket('/');

      this.socket.on('connect', () => {
        console.log('Socket connected');
        this.notifyConnectionChange(true);
        this.register();
      });

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
        this.isRegistered = false;
        this.notifyConnectionChange(false);
      });

      this.socket.on('connect_error', (error: any) => {
        console.error('Socket connection error:', error);
        this.notifyConnectionChange(false);
      });

      return true;
    } catch (error) {
      console.error('Failed to initialize socket:', error);
      return false;
    }
  }

  // Disconnect from socket server
  disconnect() {
    if (this.socket && this.socket.connected) {
      this.socket.disconnect();
      this.socket = null;
      this.isRegistered = false;
    }
  }

  // Register as a gate-out client
  private register() {
    if (this.socket && this.socket.connected) {
      this.socket.emit('register', { 
        clientType: 'gate-out', 
        clientId: 'gate-out-1' 
      });
      this.isRegistered = true;
    }
  }

  // Reconnect to socket server
  reconnect() {
    this.disconnect();
    return this.connect();
  }

  // Check if socket is connected
  isConnected(): boolean {
    return this.socket && this.socket.connected;
  }

  // Update gate status (open/closed)
  updateGateStatus(gateId: string, status: 'open' | 'closed'): boolean {
    if (this.socket && this.isRegistered) {
      this.socket.emit('gate-status', { gateId, status });
      return true;
    }
    return false;
  }

  // Notify about vehicle exit
  notifyVehicleExit(exitData: { 
    ticketId: string, 
    licensePlate: string, 
    exitTime: string,
    fee: number
  }): boolean {
    if (this.socket && this.isRegistered) {
      this.socket.emit('vehicle-exit', exitData);
      return true;
    }
    console.warn('Socket not connected or not registered, vehicle exit notification not sent');
    return false;
  }

  // Add connection change listener
  onConnectionChange(callback: (connected: boolean) => void) {
    this.connectionChangeCallbacks.push(callback);
    // Immediately notify with current status
    if (callback) {
      callback(this.isConnected());
    }
  }

  // Notify all listeners about connection changes
  private notifyConnectionChange(connected: boolean) {
    for (const callback of this.connectionChangeCallbacks) {
      callback(connected);
    }
  }
}

// Create a singleton instance
const socketService = new SocketService();

export default socketService; 