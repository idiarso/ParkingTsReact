import { VehicleEntry } from './paymentService';

class DBService {
  private storeName = 'vehicle-entries';
  
  // Initialize the database
  async init() {
    try {
      // If we're in an Electron environment, use the electron API
      if (window.electronAPI) {
        console.log('Using Electron DB API');
        // Initialization happens on the main process
        return true;
      } else {
        console.log('Using IndexedDB for storage');
        // For web-only mode, we'll use IndexedDB
        await this.initIndexedDB();
        return true;
      }
    } catch (error) {
      console.error('Failed to initialize database:', error);
      return false;
    }
  }
  
  // Initialize IndexedDB for web mode
  private async initIndexedDB() {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('parking-system', 1);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Find vehicle entry by ticket ID
  async findByTicketId(ticketId: string): Promise<VehicleEntry | null> {
    try {
      if (window.electronAPI) {
        // In a real system, this would query the database
        // For this demo, we'll use the mock data
        const allEntries = await window.electronAPI.getAll(this.storeName);
        return allEntries.find(entry => entry.ticketId === ticketId) || null;
      } else {
        // For web mode, search in IndexedDB
        const allEntries = await this.getAllEntriesFromIndexedDB();
        return allEntries.find(entry => entry.ticketId === ticketId) || null;
      }
    } catch (err) {
      console.error('Error finding entry by ticket ID:', err);
      return null;
    }
  }
  
  // Update a vehicle entry
  async updateVehicleEntry(entry: VehicleEntry): Promise<void> {
    try {
      if (window.electronAPI) {
        await window.electronAPI.put(this.storeName, entry);
      } else {
        await this.updateEntryInIndexedDB(entry);
      }
    } catch (error) {
      console.error('Failed to update vehicle entry:', error);
      throw error;
    }
  }
  
  // Private method to get all entries from IndexedDB
  private getAllEntriesFromIndexedDB(): Promise<VehicleEntry[]> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('parking-system', 1);
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        
        const getAllRequest = store.getAll();
        getAllRequest.onsuccess = () => resolve(getAllRequest.result);
        getAllRequest.onerror = () => reject(getAllRequest.error);
      };
      
      request.onerror = () => reject(request.error);
    });
  }
  
  // Private method to update entry in IndexedDB
  private updateEntryInIndexedDB(entry: VehicleEntry): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('parking-system', 1);
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        
        const putRequest = store.put(entry);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
      
      request.onerror = () => reject(request.error);
    });
  }
  
  // Generate mock data for demonstration purposes
  private getMockEntryForDemo(ticketId: string): VehicleEntry {
    // Calculate entry time (between 1-5 hours ago)
    const hoursAgo = Math.floor(1 + Math.random() * 4);
    const entryTime = Date.now() - (hoursAgo * 60 * 60 * 1000);
    
    // Generate random license plate
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const numbers = '0123456789';
    let plate = '';
    
    // Format: AB 1234 CD
    for (let i = 0; i < 2; i++) {
      plate += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    plate += ' ';
    for (let i = 0; i < 4; i++) {
      plate += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    plate += ' ';
    for (let i = 0; i < 2; i++) {
      plate += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    
    // Vehicle types
    const vehicleTypes = ['CAR', 'MOTORCYCLE', 'TRUCK', 'BUS'];
    const vehicleType = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
    
    return {
      id: `mock-${Date.now()}`,
      ticketId: ticketId || `MOCK-${Date.now()}`,
      licensePlate: plate,
      vehicleType,
      entryTime,
      processed: true
    };
  }

  async findByLicensePlate(licensePlate: string): Promise<VehicleEntry[]> {
    try {
      if (window.electronAPI) {
        const allEntries = await window.electronAPI.getAll(this.storeName);
        return allEntries.filter(entry => entry.licensePlate === licensePlate);
      } else {
        const allEntries = await this.getAllEntriesFromIndexedDB();
        return allEntries.filter(entry => entry.licensePlate === licensePlate);
      }
    } catch (err) {
      console.error('Error finding entries by license plate:', err);
      return [];
    }
  }

  async getAllActiveEntries(): Promise<VehicleEntry[]> {
    try {
      if (window.electronAPI) {
        const allEntries = await window.electronAPI.getAll(this.storeName);
        return allEntries.filter(entry => !entry.exitTime);
      } else {
        const allEntries = await this.getAllEntriesFromIndexedDB();
        return allEntries.filter(entry => !entry.exitTime);
      }
    } catch (err) {
      console.error('Error getting active entries:', err);
      return [];
    }
  }

  async getCompletedEntries(): Promise<VehicleEntry[]> {
    try {
      if (window.electronAPI) {
        const allEntries = await window.electronAPI.getAll(this.storeName);
        return allEntries.filter(entry => entry.exitTime);
      } else {
        const allEntries = await this.getAllEntriesFromIndexedDB();
        return allEntries.filter(entry => entry.exitTime);
      }
    } catch (err) {
      console.error('Error getting completed entries:', err);
      return [];
    }
  }
}

// Create a singleton instance
const dbService = new DBService();

export default dbService; 