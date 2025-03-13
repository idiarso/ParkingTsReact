// import { v4 as uuidv4 } from 'uuid';

// Simple ID generator function
const generateId = (): string => {
  return 'id-' + Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

export interface VehicleEntry {
  id: string;
  ticketId: string;
  licensePlate: string;
  vehicleType: string;
  entryTime: number;
  image?: string;
  processed: boolean;
  exitTime?: number;
  fee?: number;
}

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
  
  // Add a new vehicle entry
  async addVehicleEntry(entry: Omit<VehicleEntry, 'id'>): Promise<VehicleEntry> {
    const newEntry: VehicleEntry = {
      id: generateId(),
      ...entry
    };
    
    try {
      if (window.electronAPI) {
        await window.electronAPI.put(this.storeName, newEntry);
      } else {
        await this.addEntryToIndexedDB(newEntry);
      }
      return newEntry;
    } catch (error) {
      console.error('Failed to add vehicle entry:', error);
      throw error;
    }
  }
  
  // Get all vehicle entries
  async getVehicleEntries(): Promise<VehicleEntry[]> {
    try {
      if (window.electronAPI) {
        return await window.electronAPI.getAll(this.storeName) || [];
      } else {
        return await this.getAllEntriesFromIndexedDB();
      }
    } catch (error) {
      console.error('Failed to get vehicle entries:', error);
      return [];
    }
  }
  
  // Get vehicle entry by ID
  async getVehicleEntry(id: string): Promise<VehicleEntry | null> {
    try {
      if (window.electronAPI) {
        return await window.electronAPI.get(this.storeName, id);
      } else {
        return await this.getEntryFromIndexedDB(id);
      }
    } catch (error) {
      console.error(`Failed to get vehicle entry with ID ${id}:`, error);
      return null;
    }
  }
  
  // Get vehicle entries by license plate
  async getEntriesByLicensePlate(licensePlate: string): Promise<VehicleEntry[]> {
    try {
      const allEntries = await this.getVehicleEntries();
      return allEntries.filter(entry => 
        entry.licensePlate.toLowerCase() === licensePlate.toLowerCase()
      );
    } catch (error) {
      console.error(`Failed to get entries for license plate ${licensePlate}:`, error);
      return [];
    }
  }
  
  // Private method to add entry to IndexedDB
  private addEntryToIndexedDB(entry: VehicleEntry): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('parking-system', 1);
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        
        const addRequest = store.add(entry);
        addRequest.onsuccess = () => resolve();
        addRequest.onerror = () => reject(addRequest.error);
      };
      
      request.onerror = () => reject(request.error);
    });
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
  
  // Private method to get entry by ID from IndexedDB
  private getEntryFromIndexedDB(id: string): Promise<VehicleEntry | null> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('parking-system', 1);
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        
        const getRequest = store.get(id);
        getRequest.onsuccess = () => resolve(getRequest.result || null);
        getRequest.onerror = () => reject(getRequest.error);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // Delete a vehicle entry
  async deleteVehicleEntry(id: string): Promise<boolean> {
    try {
      if (window.electronAPI) {
        await window.electronAPI.delete(this.storeName, id);
      } else {
        await this.deleteEntryFromIndexedDB(id);
      }
      return true;
    } catch (error) {
      console.error('Failed to delete vehicle entry:', error);
      return false;
    }
  }

  // Delete all vehicle entries
  async deleteAllEntries(): Promise<boolean> {
    try {
      if (window.electronAPI) {
        // Get all entries and delete them one by one
        const entries = await window.electronAPI.getAll(this.storeName);
        for (const entry of entries) {
          if (entry && entry.id) {
            await window.electronAPI.delete(this.storeName, entry.id);
          }
        }
      } else {
        await this.clearIndexedDB();
      }
      return true;
    } catch (error) {
      console.error('Failed to delete all entries:', error);
      return false;
    }
  }

  // Private method to delete entry from IndexedDB
  private deleteEntryFromIndexedDB(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('parking-system', 1);
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        
        const deleteRequest = store.delete(id);
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // Clear all entries
  async clearEntries(): Promise<void> {
    try {
      if (window.electronAPI) {
        // Get all entries first
        const entries = await window.electronAPI.getAll(this.storeName);
        // Delete each entry individually since we don't have a clear method
        for (const entry of entries) {
          if (entry && entry.id) {
            await window.electronAPI.delete(this.storeName, entry.id);
          }
        }
      } else {
        await this.clearIndexedDB();
      }
    } catch (error) {
      console.error('Failed to clear entries:', error);
      throw error;
    }
  }

  // Clear IndexedDB store
  private async clearIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('parking-system', 1);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        try {
          const transaction = db.transaction(this.storeName, 'readwrite');
          const store = transaction.objectStore(this.storeName);
          
          const clearRequest = store.clear();
          
          clearRequest.onsuccess = () => resolve();
          clearRequest.onerror = () => reject(clearRequest.error);
          
          // Ensure transaction completes
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
        } catch (error) {
          reject(error);
        }
      };
    });
  }
}

// Create a singleton instance
const dbService = new DBService();

export default dbService; 