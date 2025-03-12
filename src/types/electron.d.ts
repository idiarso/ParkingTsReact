import { SyncQueue } from './sync';

interface DB {
  getFailedSync(syncId: string): Promise<SyncQueue | undefined>;
  removeFailedSync(syncId: string): Promise<void>;
}

declare global {
  interface Window {
    electronAPI: {
      getDB(): Promise<DB>;
      getFailedSync(syncId: string): Promise<SyncQueue | undefined>;
      removeFailedSync(syncId: string): Promise<void>;
      minimize(): void;
      maximize(): void;
      close(): void;
      isMaximized(): Promise<boolean>;
    }
  }
}

export {}; 