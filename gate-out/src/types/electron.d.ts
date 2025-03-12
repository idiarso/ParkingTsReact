interface ElectronAPI {
  getAll: (storeName: string) => Promise<any[]>;
  put: (storeName: string, data: any) => Promise<void>;
  get: (storeName: string, key: string) => Promise<any>;
  delete: (storeName: string, key: string) => Promise<void>;
}

interface Window {
  electronAPI?: ElectronAPI;
} 