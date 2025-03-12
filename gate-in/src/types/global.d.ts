declare global {
  interface Window {
    electronAPI?: {
      get: (store: string, id: string) => Promise<any>;
      put: (store: string, data: any) => Promise<void>;
      getAll: (store: string) => Promise<any[]>;
      delete: (store: string, id: string) => Promise<void>;
    };
  }
}

export {}; 