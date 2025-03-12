import { io, Socket } from 'socket.io-client';
import { store } from '../store';
import { updateVehicle } from '../store/slices/vehiclesSlice';
import { updateSession } from '../store/slices/parkingSessionsSlice';
import { setOnlineStatus } from '../store/slices/parkingSessionsSlice';

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
    
    // Business events
    this.socket.on('gate:status:update', this.handleGateStatusUpdate.bind(this));
    this.socket.on('vehicle:entry:update', this.handleVehicleEntry.bind(this));
    this.socket.on('vehicle:exit:update', this.handleVehicleExit.bind(this));
    this.socket.on('parking:status:update', this.handleParkingStatusUpdate.bind(this));
  }

  private handleConnect() {
    console.log('Socket connected');
    store.dispatch(setOnlineStatus(true));
    
    // Clear any reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Register as admin client
    this.registerAsAdmin();
    
    // Send a ping to test connection
    this.ping((response) => {
      console.log('Ping response:', response);
    });
  }
  
  private registerAsAdmin() {
    if (!this.socket || this.isRegistered) return;
    
    this.socket.emit('register:client', { type: 'admin' });
    this.isRegistered = true;
    console.log('Registered as admin client');
  }

  private handleDisconnect(reason: string) {
    console.log(`Socket disconnected: ${reason}`);
    store.dispatch(setOnlineStatus(false));
    
    // Reset registration status
    this.isRegistered = false;
    
    // Attempt to reconnect if not already reconnecting
    if (!this.reconnectTimer) {
      this.reconnectTimer = setTimeout(() => this.reconnect(), 5000);
    }
  }

  private handleConnectError(error: Error) {
    console.error('Socket connection error:', error);
    store.dispatch(setOnlineStatus(false));
    this.isRegistered = false;
  }

  private handleGateStatusUpdate(data: { gateId: string; status: 'open' | 'closed' }) {
    console.log('Gate status update:', data);
    // Handle gate status updates (can be implemented based on requirements)
  }

  private handleVehicleEntry(data: { licensePlate: string; vehicleType: string }) {
    console.log('Vehicle entry:', data);
    // Update vehicles list with new entry
    // This is a simplified implementation - in a real app, you would fetch the full vehicle details
    const newVehicle = {
      id: Date.now().toString(), // Temporary ID
      number: data.licensePlate,
      type: data.vehicleType,
      lastSynced: new Date().toISOString(),
    };
    store.dispatch(updateVehicle(newVehicle));
  }

  private handleVehicleExit(data: { licensePlate: string; duration: number; fee: number }) {
    console.log('Vehicle exit:', data);
    // Update session status for exiting vehicle
    // This is a simplified implementation - in a real app, you would fetch the full session details
  }

  private handleParkingStatusUpdate(data: { total: number; occupied: number }) {
    console.log('Parking status update:', data);
    // Update dashboard with current parking status
    // This can be implemented based on the specific UI requirements
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

  // Method to send gate status update
  updateGateStatus(gateId: string, status: 'open' | 'closed') {
    if (!this.socket) {
      console.warn('Socket not connected, cannot send gate status update');
      return;
    }
    this.socket.emit('gate:status', { gateId, status });
    console.log(`Sent gate status update for gate ${gateId}: ${status}`);
  }

  // Method to notify about parking space updates
  updateParkingStatus(total: number, occupied: number) {
    if (!this.socket) {
      console.warn('Socket not connected, cannot send parking status update');
      return;
    }
    this.socket.emit('parking:update', { total, occupied });
    console.log(`Sent parking status update - Total: ${total}, Occupied: ${occupied}`);
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