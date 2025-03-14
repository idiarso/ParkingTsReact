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
  private dbName = 'parking-system';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private initialized = false;
  private dbConnected: boolean = false;
  private initPromise: Promise<boolean> | null = null;
  private initResolver: ((value: boolean) => void) | null = null;
  private readonly DB_TIMEOUT = 30000; // 30 seconds timeout
  
  // Initialize the database
  async init() {
    if (this.initialized && this.db) {
      console.log('Database already initialized and connected');
      return true;
    }

    // If initialization is already in progress, return the existing promise
    if (this.initPromise) {
      console.log('Initialization already in progress, waiting...');
      return this.initPromise;
    }

    // Create new initialization promise
    this.initPromise = new Promise(async (resolve) => {
      this.initResolver = resolve;

      // Set timeout
      const timeoutId = setTimeout(() => {
        console.error('Database initialization timed out');
        if (this.initResolver) {
          this.initResolver(false);
        }
      }, this.DB_TIMEOUT);

      try {
        if (window.electronAPI) {
          console.log('Using Electron DB API');
          this.initialized = true;
          this.dbConnected = true;
          clearTimeout(timeoutId);
          resolve(true);
          return;
        }

        console.log('Using IndexedDB for storage');
        console.log('Browser IndexedDB support check:', !!window.indexedDB);
        
        // Explicitly log browser and version for debugging
        const userAgent = navigator.userAgent;
        console.log('Browser:', userAgent);

        // For web-only mode, we'll use IndexedDB
        await this.initIndexedDB();
        
        if (this.db) {
          console.log('IndexedDB initialized successfully');
          this.initialized = true;
          this.dbConnected = true;
          clearTimeout(timeoutId);
          resolve(true);
        } else {
          console.error('Database initialization failed: db is null');
          clearTimeout(timeoutId);
          resolve(false);
        }
      } catch (error) {
        console.error('Failed to initialize database:', error);
        clearTimeout(timeoutId);
        resolve(false);
      } finally {
        this.initPromise = null;
        this.initResolver = null;
      }
    });

    return this.initPromise;
  }
  
  // Initialize IndexedDB for web mode
  private async initIndexedDB(): Promise<void> {
    console.log('===== INISIALISASI INDEXEDDB =====');
    
    if (!window.indexedDB) {
      throw new Error('Browser tidak mendukung IndexedDB');
    }
    
    return new Promise<void>((resolve, reject) => {
      try {
        console.log(`Membuka database: ${this.dbName}, versi: ${this.dbVersion}`);
        
        const request = indexedDB.open(this.dbName, this.dbVersion);
        let hasError = false;
        
        request.onupgradeneeded = (event) => {
          console.log('Database perlu upgrade, membuat object store');
          const db = (event.target as IDBOpenDBRequest).result;
          
          if (!db.objectStoreNames.contains(this.storeName)) {
            console.log(`Membuat object store: ${this.storeName}`);
            const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
            store.createIndex('ticketId', 'ticketId', { unique: true });
            store.createIndex('licensePlate', 'licensePlate', { unique: false });
            store.createIndex('entryTime', 'entryTime', { unique: false });
          }
        };
        
        request.onsuccess = (event) => {
          if (hasError) return;
          
          this.db = (event.target as IDBOpenDBRequest).result;
          console.log('Database berhasil dibuka');
          
          this.db.onerror = (event) => {
            console.error('Database error:', event);
          };
          
          resolve();
        };
        
        request.onerror = (event) => {
          hasError = true;
          console.error('Error membuka database:', request.error);
          reject(request.error);
        };
        
        request.onblocked = (event) => {
          hasError = true;
          console.error('Database blocked. Close other tabs with this app open');
          reject(new Error('Database blocked'));
        };
        
      } catch (error) {
        console.error('Critical error during IndexedDB initialization:', error);
        reject(error);
      }
    });
  }
  
  // Add a new vehicle entry
  async addVehicleEntry(entry: Omit<VehicleEntry, 'id'>): Promise<VehicleEntry> {
    console.log('===== MENYIMPAN DATA KENDARAAN =====');
    console.log('Status database:', this.initialized ? 'TERINISIALISASI' : 'BELUM TERINISIALISASI');

    if (!this.initialized) {
      console.log('Database belum terinisialisasi, mencoba inisialisasi...');
      const initResult = await this.init();
      console.log('Hasil inisialisasi:', initResult ? 'BERHASIL' : 'GAGAL');
      
      if (!initResult) {
        console.error('GAGAL menginisialisasi database!');
        throw new Error('Tidak dapat menginisialisasi database');
      }
    }
    
    if (!this.db) {
      console.error('KESALAHAN: this.db masih null meskipun this.initialized adalah true');
      await this.forceInitialize();
      
      if (!this.db) {
        console.error('GAGAL: Database masih null setelah force initialize');
        throw new Error('Database tidak tersedia');
      }
    }
    
    const newEntry: VehicleEntry = {
      id: generateId(),
      ...entry
    };
    
    try {
      console.log('Menambahkan entri kendaraan:', newEntry);
      
      if (window.electronAPI) {
        await window.electronAPI.put(this.storeName, newEntry);
        console.log('Entry ditambahkan via ElectronAPI');
      } else {
        await this.addEntryToIndexedDB(newEntry);
        console.log('Entry ditambahkan via IndexedDB');
      }
      
      // Verifikasi data telah tersimpan
      let savedEntry;
      try {
        savedEntry = await this.getVehicleEntry(newEntry.id);
        console.log('Verifikasi penyimpanan:', savedEntry ? 'DATA DITEMUKAN' : 'DATA TIDAK DITEMUKAN');
      } catch (verifyError) {
        console.error('Error saat verifikasi penyimpanan:', verifyError);
      }
      
      console.log('Entry ditambahkan dengan sukses, ID:', newEntry.id);
      return newEntry;
    } catch (error) {
      console.error('GAGAL menambahkan vehicle entry:', error);
      throw error;
    }
  }
  
  // Get all vehicle entries
  async getVehicleEntries(): Promise<VehicleEntry[]> {
    if (!this.initialized) {
      console.log('Database not initialized, initializing now...');
      await this.init();
    }
    
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
    if (!this.initialized) {
      console.log('Database not initialized, initializing now...');
      await this.init();
    }
    
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
    console.log('===== MENAMBAHKAN DATA KE INDEXEDDB =====');
    
    return new Promise((resolve, reject) => {
      if (!this.db) {
        console.error('Database belum terinisialisasi untuk addEntryToIndexedDB');
        
        // Coba inisialisasi ulang
        this.init().then(() => {
          if (this.db) {
            console.log('Database berhasil diinisialisasi ulang, mencoba simpan data lagi...');
            this.addEntryToIndexedDB(entry).then(resolve).catch(reject);
          } else {
            reject(new Error('Gagal menginisialisasi database'));
          }
        }).catch(reject);
        
        return;
      }

      try {
        console.log('Menambahkan data ke IndexedDB:', entry);
        
        // Cek apakah object store ada
        if (!this.db.objectStoreNames.contains(this.storeName)) {
          console.error(`Object store ${this.storeName} tidak ditemukan!`);
          reject(new Error(`Object store ${this.storeName} tidak ditemukan`));
          return;
        }
        
        // Buat transaksi baru untuk operasi ini
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        
        transaction.onabort = (event) => {
          console.error('Transaksi dibatalkan:', transaction.error);
          reject(transaction.error);
        };
        
        transaction.onerror = (event) => {
          console.error('Error transaksi:', transaction.error);
          reject(transaction.error);
        };
        
        transaction.oncomplete = () => {
          console.log('Transaksi add berhasil diselesaikan');
          resolve();
        };
        
        const store = transaction.objectStore(this.storeName);
        
        // If an entry with the same ID exists, this will overwrite it
        const addRequest = store.put(entry);
        
        addRequest.onsuccess = () => {
          console.log('Data berhasil ditambahkan ke IndexedDB dengan ID:', addRequest.result);
          
          // Coba verifikasi data telah tersimpan
          const checkRequest = store.get(entry.id);
          
          checkRequest.onsuccess = () => {
            const storedEntry = checkRequest.result;
            if (storedEntry) {
              console.log('Verifikasi penyimpanan: Data ditemukan dalam database');
            } else {
              console.warn('Verifikasi penyimpanan: Data TIDAK ditemukan dalam database meskipun add berhasil!');
            }
          };
          
          checkRequest.onerror = () => {
            console.warn('Gagal memverifikasi data tersimpan:', checkRequest.error);
          };
        };
        
        addRequest.onerror = () => {
          console.error('Error menambahkan data ke IndexedDB:', addRequest.error);
          
          // Cek apakah error karena constraint violation (unique index)
          if (addRequest.error && addRequest.error.name === 'ConstraintError') {
            console.error('Error ini adalah konflik duplikat entri');
          }
          
          reject(addRequest.error);
        };
      } catch (error) {
        console.error('Error dalam addEntryToIndexedDB:', error);
        reject(error);
      }
    });
  }
  
  // Private method to get all entries from IndexedDB
  private getAllEntriesFromIndexedDB(): Promise<VehicleEntry[]> {
    console.log('===== MENGAMBIL SEMUA DATA DARI INDEXEDDB =====');
    
    return new Promise((resolve, reject) => {
      if (!this.db) {
        console.error('Database belum terinisialisasi untuk getAllEntriesFromIndexedDB');
        
        // Coba inisialisasi ulang
        this.init().then(() => {
          if (this.db) {
            console.log('Database berhasil diinisialisasi ulang, mencoba mengambil data lagi...');
            this.getAllEntriesFromIndexedDB().then(resolve).catch(reject);
          } else {
            reject(new Error('Gagal menginisialisasi database'));
          }
        }).catch(reject);
        
        return;
      }
      
      try {
        console.log('Mengambil semua data dari IndexedDB...');
        
        // Cek apakah object store ada
        if (!this.db.objectStoreNames.contains(this.storeName)) {
          console.error(`Object store ${this.storeName} tidak ditemukan!`);
          
          // Kembalikan array kosong sebagai fallback
          console.warn('Mengembalikan array kosong karena object store tidak ditemukan');
          resolve([]);
          return;
        }
        
        const transaction = this.db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        
        const getAllRequest = store.getAll();
        
        getAllRequest.onsuccess = () => {
          const entries = getAllRequest.result;
          console.log(`Berhasil mengambil ${entries.length} entri dari IndexedDB`);
          
          // Log beberapa entri untuk debugging
          if (entries.length > 0) {
            console.log('Contoh entri pertama:', entries[0]);
          }
          
          resolve(entries);
        };
        
        getAllRequest.onerror = () => {
          console.error('Error saat mengambil data dari IndexedDB:', getAllRequest.error);
          reject(getAllRequest.error);
        };
        
        transaction.oncomplete = () => {
          console.log('Transaksi getAll selesai');
        };
        
        transaction.onerror = () => {
          console.error('Error transaksi getAll:', transaction.error);
          reject(transaction.error);
        };
      } catch (error) {
        console.error('Error dalam getAllEntriesFromIndexedDB:', error);
        reject(error);
      }
    });
  }
  
  // Private method to get entry by ID from IndexedDB
  private getEntryFromIndexedDB(id: string): Promise<VehicleEntry | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        console.error('Database not initialized for getEntryFromIndexedDB');
        return reject(new Error('Database not initialized'));
      }
      
      try {
        console.log(`Getting entry with ID ${id} from IndexedDB`);
        const transaction = this.db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        
        const getRequest = store.get(id);
        
        getRequest.onsuccess = () => {
          console.log(`Entry retrieval result:`, getRequest.result ? 'Found' : 'Not found');
          resolve(getRequest.result || null);
        };
        
        getRequest.onerror = () => {
          console.error('Error getting entry from IndexedDB:', getRequest.error);
          reject(getRequest.error);
        };
      } catch (error) {
        console.error(`Error in getEntryFromIndexedDB for ID ${id}:`, error);
        reject(error);
      }
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
      if (!this.db) {
        console.error('Database not initialized for deleteEntryFromIndexedDB');
        return reject(new Error('Database not initialized'));
      }
      
      try {
        console.log(`Deleting entry with ID ${id} from IndexedDB`);
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        
        const deleteRequest = store.delete(id);
        
        deleteRequest.onsuccess = () => {
          console.log(`Entry with ID ${id} deleted successfully`);
          resolve();
        };
        
        deleteRequest.onerror = () => {
          console.error('Error deleting entry from IndexedDB:', deleteRequest.error);
          reject(deleteRequest.error);
        };
        
        transaction.oncomplete = () => {
          console.log('Delete transaction completed');
        };
        
        transaction.onerror = () => {
          console.error('Delete transaction error:', transaction.error);
          reject(transaction.error);
        };
      } catch (error) {
        console.error(`Error in deleteEntryFromIndexedDB for ID ${id}:`, error);
        reject(error);
      }
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
      if (!this.db) {
        console.error('Database not initialized for clearIndexedDB');
        return reject(new Error('Database not initialized'));
      }
      
      try {
        console.log('Clearing all entries from IndexedDB');
        const transaction = this.db.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        
        const clearRequest = store.clear();
        
        clearRequest.onsuccess = () => {
          console.log('All entries cleared successfully');
          resolve();
        };
        
        clearRequest.onerror = () => {
          console.error('Error clearing entries from IndexedDB:', clearRequest.error);
          reject(clearRequest.error);
        };
        
        transaction.oncomplete = () => {
          console.log('Clear transaction completed');
        };
        
        transaction.onerror = () => {
          console.error('Clear transaction error:', transaction.error);
          reject(transaction.error);
        };
      } catch (error) {
        console.error('Error in clearIndexedDB:', error);
        reject(error);
      }
    });
  }

  // Mendapatkan status database saat ini
  getDatabaseStatus(): { initialized: boolean; dbConnected: boolean } {
    return {
      initialized: this.initialized,
      dbConnected: this.dbConnected
    };
  }
  
  // Memaksa inisialisasi ulang database
  async forceInitialize(): Promise<boolean> {
    console.log('Memulai force initialize database...');
    
    // Reset status
    this.initialized = false;
    this.dbConnected = false;
    this.db = null;
    
    try {
      // Coba inisialisasi ulang
      const result = await this.init();
      console.log('Force initialize selesai dengan hasil:', result);
      return result;
    } catch (error) {
      console.error('Error saat force initialize database:', error);
      return false;
    }
  }
  
  // Tes database dengan menambahkan dan mengambil data tes
  async testDatabase(): Promise<boolean> {
    console.log('Memulai tes database...');
    
    if (!this.db || !this.initialized) {
      console.error('Database belum diinisialisasi');
      return false;
    }
    
    try {
      // Buat data tes
      const testData = {
        ticketId: `TEST-${Date.now()}`,
        entryTime: Date.now(),
        vehicleType: 'TEST',
        licensePlate: 'TEST-123',
        imageUrl: 'test-image.jpg',
        processed: false
      };
      
      // Simpan data tes
      console.log('Menyimpan data tes:', testData);
      await this.addVehicleEntry(testData);
      
      // Ambil data tes
      console.log('Mengambil data tes...');
      const entries = await this.getVehicleEntries();
      console.log('Data yang diambil:', entries);
      
      // Cek apakah data tes ada
      const testEntry = entries.find(entry => entry.ticketId === testData.ticketId);
      const success = !!testEntry;
      
      console.log('Hasil tes database:', success ? 'BERHASIL' : 'GAGAL');
      return success;
    } catch (error) {
      console.error('Error saat tes database:', error);
      return false;
    }
  }
}

// Create a singleton instance
const dbService = new DBService();

export default dbService; 