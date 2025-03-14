import socketService from './socketService';

interface HardwareStatus {
  pushButton: boolean;
  loopDetector: boolean;
  printer: boolean;
  camera: boolean;
  gate: 'open' | 'closed';
  vehiclePresent: boolean;
}

interface VehicleImage {
  imageData: string;
  timestamp: number;
  licensePlate?: string;
}

class HardwareService {
  private status: HardwareStatus = {
    pushButton: false,
    loopDetector: false,
    printer: true,
    camera: true,
    gate: 'closed',
    vehiclePresent: false
  };

  private listeners: ((status: HardwareStatus) => void)[] = [];
  private vehicleImages: Map<string, VehicleImage> = new Map();
  private loopDetectorTimeout: NodeJS.Timeout | null = null;

  constructor() {
    // Listen for hardware events from the socket server
    socketService.on('hardware-status', (status: Partial<HardwareStatus>) => {
      this.updateStatus(status);
    });

    // Simulate loop detector events
    setInterval(() => {
      const hasVehicle = Math.random() > 0.7;
      if (hasVehicle !== this.status.loopDetector) {
        this.handleLoopDetection(hasVehicle);
      }
    }, 2000);
  }

  private handleLoopDetection(detected: boolean) {
    // Clear any existing timeout
    if (this.loopDetectorTimeout) {
      clearTimeout(this.loopDetectorTimeout);
      this.loopDetectorTimeout = null;
    }

    if (detected) {
      // Vehicle detected
      this.updateStatus({ 
        loopDetector: true,
        vehiclePresent: true 
      });

      // Set timeout to reset detection after 30 seconds
      this.loopDetectorTimeout = setTimeout(() => {
        this.updateStatus({ 
          loopDetector: false,
          vehiclePresent: false 
        });
      }, 30000);
    } else {
      // No vehicle detected
      this.updateStatus({ 
        loopDetector: false,
        vehiclePresent: false 
      });
    }
  }

  private updateStatus(newStatus: Partial<HardwareStatus>) {
    this.status = { ...this.status, ...newStatus };
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.status));
  }

  public onStatusChange(callback: (status: HardwareStatus) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  public getStatus(): HardwareStatus {
    return { ...this.status };
  }

  public async captureVehicleImage(ticketId: string, licensePlate?: string): Promise<boolean> {
    try {
      // Simulate camera capture
      const imageData = 'data:image/jpeg;base64,SIMULATED_IMAGE_DATA';
      
      this.vehicleImages.set(ticketId, {
        imageData,
        timestamp: Date.now(),
        licensePlate
      });

      // Notify socket server about image capture
      socketService.emit('vehicle-image-captured', {
        ticketId,
        imageData,
        licensePlate
      });

      return true;
    } catch (error) {
      console.error('Failed to capture vehicle image:', error);
      return false;
    }
  }

  public async printTicket(ticketData: {
    ticketId: string;
    entryTime: string;
    licensePlate?: string;
    vehicleType: string;
    qrCode: string;
  }): Promise<boolean> {
    try {
      console.log('Attempting to print ticket:', ticketData);
      
      // Check if printer is ready
      if (!this.isPrinterReady()) {
        console.error('Printer is not ready or not connected');
        return false;
      }
      
      // In development mode - simulate printer communication
      console.log('Simulating printer communication...');
      console.log('Ticket data to print:', JSON.stringify(ticketData, null, 2));
      
      // Generate actual ticket content that would be sent to the printer
      const ticketContent = this.formatTicketForPrinting(ticketData);
      console.log('Formatted ticket content:', ticketContent);
      
      // Simulate printer processing time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Log successful printing
      console.log('Ticket successfully printed');
      
      // Notify ticket printed via socket
      socketService.emit('ticket-printed', ticketData);
      
      return true;
    } catch (error) {
      console.error('Error printing ticket:', error);
      return false;
    }
  }
  
  // Format ticket data for printing
  private formatTicketForPrinting(ticketData: {
    ticketId: string;
    entryTime: string;
    licensePlate?: string;
    vehicleType: string;
    qrCode: string;
  }): string {
    // This would format the ticket data as needed by your thermal printer
    // Example format (modify based on your printer's requirements)
    return `
    ===================================
    TIKET PARKIR
    ===================================
    Ticket ID: ${ticketData.ticketId}
    Nomor Plat: ${ticketData.licensePlate || '(Tidak Terdeteksi)'}
    Jenis Kendaraan: ${ticketData.vehicleType}
    Waktu Masuk: ${new Date(ticketData.entryTime).toLocaleString('id-ID')}
    
    QR Code: ${ticketData.qrCode}
    ===================================
    `;
  }
  
  // Check if printer is ready (simulated for development)
  private isPrinterReady(): boolean {
    // In development mode - always return true
    // In production - would check actual printer status
    console.log('Checking printer status...');
    
    // Simulate random printer issues (10% chance of failure)
    const isReady = Math.random() < 0.9;
    console.log('Printer status:', isReady ? 'Ready' : 'Not ready');
    return isReady;
  }

  public async openGate(): Promise<boolean> {
    try {
      if (!this.status.loopDetector) {
        throw new Error('No vehicle detected at gate');
      }

      this.updateStatus({ gate: 'open' });
      socketService.emit('gate-command', { gate: 'in', action: 'open' });
      
      // Auto close gate after 5 seconds
      setTimeout(() => {
        if (this.status.vehiclePresent) {
          console.log('Vehicle still present, keeping gate open');
          return;
        }
        this.updateStatus({ gate: 'closed' });
        socketService.emit('gate-command', { gate: 'in', action: 'close' });
      }, 5000);
      
      return true;
    } catch (error) {
      console.error('Failed to control gate:', error);
      return false;
    }
  }

  public simulatePushButton() {
    if (!this.status.vehiclePresent) {
      console.log('No vehicle detected, ignoring push button');
      return;
    }

    this.updateStatus({ pushButton: true });
    setTimeout(() => {
      this.updateStatus({ pushButton: false });
    }, 200);
  }

  public getVehicleImage(ticketId: string): VehicleImage | undefined {
    return this.vehicleImages.get(ticketId);
  }
}

export const hardwareService = new HardwareService();
export type { HardwareStatus, VehicleImage }; 