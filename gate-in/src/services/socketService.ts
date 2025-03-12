import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isRegistered: boolean = false;

  connect() {
    if (this.socket) return;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', this.handleConnect.bind(this));
    this.socket.on('disconnect', this.handleDisconnect.bind(this));
    this.socket.on('connect_error', this.handleConnectError.bind(this));
    
    // System events
    this.socket.on('gate:status:update', this.handleGateStatusUpdate.bind(this));
    this.socket.on('parking:status:update', this.handleParkingStatusUpdate.bind(this));
  }

  private handleConnect() {
    console.log('Socket connected');
    
    // Clear any reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Register as gate-in client
    this.registerAsGateIn();
    
    // Send a ping to test connection
    this.ping((response) => {
      console.log('Ping response:', response);
    });
  }

  private registerAsGateIn() {
    if (!this.socket || this.isRegistered) return;
    
    this.socket.emit('register:client', { type: 'gate-in' });
    this.isRegistered = true;
    console.log('Registered as gate-in client');
  }

  private handleDisconnect(reason: string) {
    console.log(`Socket disconnected: ${reason}`);
    
    // Reset registration status
    this.isRegistered = false;
    
    // Attempt to reconnect if not already reconnecting
    if (!this.reconnectTimer) {
      this.reconnectTimer = setTimeout(() => this.reconnect(), 5000);
    }
  }

  private handleConnectError(error: Error) {
    console.error('Socket connection error:', error);
    this.isRegistered = false;
  }
  
  private handleGateStatusUpdate(data: { gateId: string; status: 'open' | 'closed' }) {
    console.log(`Gate ${data.gateId} status updated to ${data.status}`);
    // Additional logic can be added here if needed
  }
  
  private handleParkingStatusUpdate(data: { total: number; occupied: number }) {
    console.log(`Parking status updated - Total: ${data.total}, Occupied: ${data.occupied}`);
    // Additional logic can be added here if needed
  }

  reconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket.connect();
    } else {
      this.connect();
    }
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

  // Method to notify about vehicle entry
  notifyVehicleEntry(licensePlate: string, vehicleType: string) {
    if (!this.socket) {
      console.warn('Socket not connected, cannot send vehicle entry notification');
      return;
    }
    
    this.socket.emit('vehicle:entry', { 
      licensePlate, 
      vehicleType 
    });
    console.log(`Sent vehicle entry notification for ${licensePlate}`);
  }

  // Method to notify about vehicle exit
  notifyVehicleExit(licensePlate: string, duration: number, fee: number) {
    if (!this.socket) return;
    this.socket.emit('vehicle:exit', { licensePlate, duration, fee });
  }

  // Method to update gate status
  updateGateStatus(gateId: string, status: 'open' | 'closed') {
    if (!this.socket) {
      console.warn('Socket not connected, cannot send gate status update');
      return;
    }
    
    this.socket.emit('gate:status:update', { gateId, status });
    console.log(`Sent gate status update for gate ${gateId}: ${status}`);
  }
  
  // Method to check server connectivity
  ping(callback: (response: { time: string }) => void) {
    if (!this.socket) {
      console.warn('Socket not connected, cannot ping server');
      return;
    }
    
    this.socket.emit('ping', callback);
  }
  
  // Method to check if socket is connected
  isConnected(): boolean {
    return !!this.socket && this.socket.connected;
  }
}

// Create a singleton instance
const socketService = new SocketService();
export default socketService; 