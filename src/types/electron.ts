interface SyncQueue {
  id: string;
  timestamp: string;
  error: string;
}

interface DB {
  getAllParkingSessions(): Promise<any[]>;
  endParkingSession(sessionId: string): Promise<void>;
  getAllVehicles(): Promise<any[]>;
  getSettings(): Promise<any>;
  updateSettings(settings: any): Promise<void>;
  getFailedSync(syncId: string): Promise<SyncQueue | undefined>;
  removeFailedSync(syncId: string): Promise<void>;
}

declare global {
  interface Window {
    electronAPI: {
      getDB(): Promise<DB>;
      getFailedSync(syncId: string): Promise<SyncQueue | undefined>;
      removeFailedSync(syncId: string): Promise<void>;
    };
  }
}

export {}; 