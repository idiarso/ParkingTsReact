// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Manager } from 'socket.io-client';
import io from 'socket.io-client';

// Mendukung multiple port dengan fallback otomatis
const PRIMARY_SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
// Alternatif port jika yang utama tidak tersedia
const FALLBACK_SOCKET_URLS = [
  'http://localhost:5001',
  'http://localhost:3000',
  'http://localhost:8080'
];
// Menambahkan dukungan mode offline untuk testing
const OFFLINE_MODE = localStorage.getItem('OFFLINE_MODE') === 'true';
const IS_DEV = process.env.NODE_ENV === 'development';

console.log('Environment:', {
  SOCKET_URL: PRIMARY_SOCKET_URL,
  IS_DEV,
  NODE_ENV: process.env.NODE_ENV
});

if (OFFLINE_MODE) {
  console.log('⚠️ APLIKASI BERJALAN DALAM MODE OFFLINE (semua data disimpan lokal)');
}

class SocketService {
  private socket: ReturnType<typeof io> | null = null;
  private isInitialized = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isRegistered: boolean = false;
  private connectionChangeCallbacks: ((connected: boolean) => void)[] = [];
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private initPromise: Promise<void> | null = null;
  private currentServerUrl: string = PRIMARY_SOCKET_URL;
  private triedUrls: Set<string> = new Set();
  private offlineMode: boolean = OFFLINE_MODE;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  async initialize(serverUrl: string = PRIMARY_SOCKET_URL): Promise<void> {
    // Jika dalam mode offline, jangan coba koneksi socket
    if (this.offlineMode) {
      console.log('Aplikasi dalam mode offline, tidak mencoba koneksi socket');
      this.notifyConnectionChange(false);
      return Promise.resolve();
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.currentServerUrl = serverUrl;
    this.triedUrls.add(serverUrl);

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
          this.tryNextServerOrReconnect();
        });

        // Wait for connection
        connectionPromise
          .then(() => resolve())
          .catch((error) => {
            this.tryNextServerOrReconnect();
            reject(error);
          });

      } catch (error) {
        console.error('Failed to initialize socket:', error);
        this.tryNextServerOrReconnect();
        reject(error);
      }
    });

    return this.initPromise;
  }
  
  // Mencoba port alternatif jika yang utama tidak tersedia
  private tryNextServerOrReconnect() {
    // Reset init promise untuk mencoba kembali
    this.initPromise = null;
    
    // Cari URL alternatif yang belum dicoba
    const availableFallbacks = FALLBACK_SOCKET_URLS.filter(url => !this.triedUrls.has(url));
    
    if (availableFallbacks.length > 0) {
      const nextUrl = availableFallbacks[0];
      console.log(`Trying alternative socket server: ${nextUrl}`);
      
      // Mencoba URL baru
      setTimeout(() => {
        this.initialize(nextUrl).catch(err => {
          console.error(`Failed to connect to alternative server ${nextUrl}:`, err);
        });
      }, 1000);
    } else {
      console.log('All server URLs have been tried, falling back to reconnect strategy');
      
      // Reset tried URLs setelah mencoba semua opsi
      this.triedUrls.clear();
      this.triedUrls.add(PRIMARY_SOCKET_URL); // Tetap tandai URL utama

      this.reconnect();
    }
  }

  // Toggle mode offline
  setOfflineMode(enabled: boolean): void {
    this.offlineMode = enabled;
    localStorage.setItem('OFFLINE_MODE', enabled.toString());
    
    if (enabled) {
      console.log('⚠️ Mode offline diaktifkan - data akan disimpan lokal saja');
      
      // Disconnect socket jika terhubung
      if (this.socket && this.socket.connected) {
        this.socket.disconnect();
      }
      
      this.notifyConnectionChange(false);
    } else {
      console.log('Mode offline dinonaktifkan - mencoba koneksi...');
      this.initPromise = null; // Reset agar kita bisa coba connect lagi
      this.initialize().catch(error => {
        console.error('Gagal menghubungkan ke server setelah menonaktifkan mode offline:', error);
      });
    }
  }

  private async registerAsGateIn(): Promise<void> {
    if (this.offlineMode) {
      console.log('Mode offline aktif, melewati registrasi ke server');
      return Promise.resolve();
    }
    
    if (!this.socket) {
      console.error('Cannot register gate-in: Socket not initialized');
      return;
    }
    
    // If already registered, no need to register again
    if (this.isRegistered) {
      console.log('Already registered as gate-in client');
      return;
    }
    
    console.log('Registering as gate-in client...');
    
    // Remove any existing listeners first to prevent duplicates
    this.socket.off('register:success');
    this.socket.off('register:error');
    
    return new Promise<void>((resolve) => {
      if (!this.socket) {
        console.error('Socket not initialized');
        resolve(); // Resolve anyway to continue app flow
        return;
      }

      // Increase timeout to 30 seconds and log intermediate status
      const timeoutId = setTimeout(() => {
        console.error('Registration timed out after 30 seconds');
        
        // Consider the app partially registered and continue
        console.log('Continuing operation in limited mode...');
        this.isRegistered = false;
        
        // Attempt reconnect in background
        this.scheduleReconnect();
        
        resolve(); // Resolve anyway to allow app to function
      }, 30000);

      // Success handler
      this.socket.once('register:success', () => {
        clearTimeout(timeoutId);
        this.isRegistered = true;
        console.log('Successfully registered as gate-in client');
        resolve();
      });

      // Error handler - resolve anyway but trigger reconnect
      this.socket.once('register:error', (error: any) => {
        clearTimeout(timeoutId);
        this.isRegistered = false;
        console.error('Failed to register as gate-in:', error);
        
        // Schedule reconnect
        this.scheduleReconnect();
        
        // Resolve anyway to allow app to function
        resolve();
      });

      // Now emit registration event after setting up handlers
      console.log('Emitting register:client event...');
      this.socket.emit('register:client', { type: 'gate-in' });
      
      // Set up heartbeat to help keep connection alive
      this.setupHeartbeat();
    });
  }

  private setupHeartbeat(): void {
    // Membersihkan interval yang ada (jika ada)
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (!this.socket) {
      console.warn('Cannot setup heartbeat: Socket not initialized');
      return;
    }

    // Setup heartbeat baru
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.connected) {
        console.log('Sending heartbeat...');
        this.socket.emit('ping', { timestamp: Date.now() });
        
        // Mendengarkan respons pong
        this.socket.once('pong', (data: { timestamp: number }) => {
          console.log('Heartbeat response received', data);
        });
      } else {
        console.warn('Socket disconnected, heartbeat paused');
      }
    }, 30000); // Kirim heartbeat setiap 30 detik
  }

  // Membersihkan interval heartbeat 
  private clearHeartbeatInterval(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
  
  // Schedule reconnect with exponential backoff
  private scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached. Please check server status.');
      // Reset untuk mencoba dari awal
      this.reconnectAttempts = 0;
      this.triedUrls.clear();
      return;
    }

    // Calculate delay with exponential backoff (1s, 2s, 4s, 8s, etc.)
    const delay = Math.min(30000, 1000 * Math.pow(2, this.reconnectAttempts));
    this.reconnectAttempts++;
    
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    this.reconnectTimer = setTimeout(() => {
      console.log('Attempting to reconnect...');
      this._reconnect();
    }, delay);
  }
  
  // Improved reconnect function
  private _reconnect() {
    if (this.socket) {
      console.log('Attempting to reconnect socket...');
      // Force disconnect and reconnect
      this.socket.disconnect();
      this.socket.connect();
      
      // Set up one-time connect handler for this reconnect attempt
      this.socket.once('connect', () => {
        console.log('Socket reconnected successfully');
        this.registerAsGateIn();
      });
    } else {
      console.log('Socket not initialized, calling initialize...');
      this.initialize().catch(err => {
        console.error('Failed to initialize during reconnect:', err);
        this.scheduleReconnect();
      });
    }
  }
  
  // Expose public reconnection method
  public reconnect(): void {
    console.log('Manual reconnection initiated');
    // Reset reconnect attempt counter to avoid hitting max attempts too quickly
    this.reconnectAttempts = 0;
    // Clear tried URLs to start fresh with primary server
    this.triedUrls.clear();
    // Perform reconnection
    this._reconnect();
  }
  
  // Check connection status
  public isConnected(): boolean {
    if (this.offlineMode) {
      return false;
    }
    return this.socket?.connected || false;
  }
  
  // Override notify functions to work even when not registered
  notifyVehicleEntry(data: { 
    ticketId: string; 
    licensePlate: string; 
    vehicleType: string;
    entryTime: string;
  }) {
    if (!this.socket) {
      console.warn('Socket not connected, cannot notify vehicle entry');
      this.storeOfflineEvent('vehicle:entry', data);
      return;
    }
    
    if (!this.socket.connected) {
      console.warn('Socket not connected, buffering vehicle entry for later');
      this.storeOfflineEvent('vehicle:entry', data);
      return;
    }
    
    // Send even if not registered - server should handle this gracefully
    this.socket.emit('vehicle:entry', data);
    console.log(`Sent vehicle entry notification for ${data.licensePlate}`);
  }
  
  // Store events yang terjadi saat offline untuk disinkronkan nanti
  private offlineEvents: {event: string, data: any}[] = [];
  private isOfflineEventsBeingSynced = false;
  
  private storeOfflineEvent(event: string, data: any) {
    // Simpan event untuk sinkronisasi nanti
    this.offlineEvents.push({event, data});
    
    // Simpan ke localStorage agar tersedia setelah restart
    try {
      const storedEvents = JSON.parse(localStorage.getItem('offlineEvents') || '[]');
      storedEvents.push({event, data, timestamp: Date.now()});
      localStorage.setItem('offlineEvents', JSON.stringify(storedEvents));
      console.log(`Event ${event} stored for offline sync, total pending: ${storedEvents.length}`);
    } catch (error) {
      console.error('Failed to store offline event to localStorage:', error);
    }
  }
  
  private syncOfflineEvents() {
    if (!this.socket || !this.socket.connected || this.isOfflineEventsBeingSynced) {
      return;
    }
    
    this.isOfflineEventsBeingSynced = true;
    
    try {
      // Ambil event dari localStorage
      const storedEvents = JSON.parse(localStorage.getItem('offlineEvents') || '[]');
      
      if (storedEvents.length === 0) {
        this.isOfflineEventsBeingSynced = false;
        return;
      }
      
      console.log(`Syncing ${storedEvents.length} offline events...`);
      
      // Proses masing-masing event
      const syncEvent = (index: number) => {
        if (index >= storedEvents.length) {
          // Semua event sudah disinkronkan
          localStorage.setItem('offlineEvents', '[]');
          this.isOfflineEventsBeingSynced = false;
          console.log('All offline events have been synced');
          return;
        }
        
        const {event, data} = storedEvents[index];
        
        if (this.socket && this.socket.connected) {
          console.log(`Syncing offline event: ${event}`);
          this.socket.emit(event, data);
          
          // Tunggu sedikit waktu antara event untuk menghindari flood
          setTimeout(() => syncEvent(index + 1), 300);
        } else {
          // Koneksi terputus saat sinkronisasi, simpan kembali events yang belum selesai
          const remainingEvents = storedEvents.slice(index);
          localStorage.setItem('offlineEvents', JSON.stringify(remainingEvents));
          this.isOfflineEventsBeingSynced = false;
          console.log(`Sync interrupted at event ${index}/${storedEvents.length}, will retry later`);
        }
      };
      
      // Mulai sinkronisasi
      syncEvent(0);
    } catch (error) {
      console.error('Error syncing offline events:', error);
      this.isOfflineEventsBeingSynced = false;
    }
  }
  
  updateGateStatus(gateId: string, status: 'open' | 'closed') {
    if (!this.socket) {
      console.warn('Socket not connected, cannot update gate status');
      this.storeOfflineEvent('gate:status:update', { gateId, status });
      return;
    }
    
    if (!this.socket.connected) {
      console.warn('Socket not connected, buffering gate status for later');
      this.storeOfflineEvent('gate:status:update', { gateId, status });
      return;
    }
    
    // Send even if not registered
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
    
    // If reconnecting, try to sync offline events
    if (this.isConnected()) {
      this.syncOfflineEvents();
    }
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
    
    // If reconnected, try to sync offline events
    if (connected) {
      this.syncOfflineEvents();
    }
  }

  emit(event: string, data: any): void {
    if (!this.socket) {
      console.warn(`Cannot emit ${event} - socket not initialized`);
      this.storeOfflineEvent(event, data);
      return;
    }
    
    if (!this.socket.connected) {
      console.warn(`Cannot emit ${event} - socket not connected`);
      this.storeOfflineEvent(event, data);
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
}

// Create a singleton instance
const socketServiceInstance = new SocketService();

// Export the singleton instance
export default socketServiceInstance; 