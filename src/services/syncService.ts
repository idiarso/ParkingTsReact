import { openDB, IDBPDatabase } from 'idb';
import { v4 as uuidv4 } from 'uuid';
import { SyncQueue } from '../types/sync';

export interface SyncConfig {
  syncInterval: number;
  priority: 'realtime' | 'batch';
  conflictResolution: 'server' | 'client' | 'manual';
  retryAttempts: number;
}

interface DBSchema {
  getFailedSync(syncId: string): Promise<SyncQueue | undefined>;
  removeFailedSync(syncId: string): Promise<void>;
}

export class SyncService {
  private db: IDBPDatabase | null = null;
  private syncWorker: Worker | null = null;
  private config: SyncConfig = {
    syncInterval: 5000, // 5 seconds
    priority: 'realtime',
    conflictResolution: 'server',
    retryAttempts: 3
  };

  constructor() {
    this.initializeDB();
    this.initializeSyncWorker();
  }

  private async initializeDB() {
    this.db = await openDB('parkingSync', 1, {
      upgrade(db) {
        // Create sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id' });
        }
        // Create offline data store
        if (!db.objectStoreNames.contains('offlineData')) {
          db.createObjectStore('offlineData', { keyPath: 'id' });
        }
      }
    });
  }

  private initializeSyncWorker() {
    if ('serviceWorker' in navigator) {
      this.syncWorker = new Worker('/syncWorker.ts');
      this.syncWorker.onmessage = this.handleWorkerMessage.bind(this);
    }
  }

  private handleWorkerMessage(event: MessageEvent) {
    const { type, data } = event.data;
    switch (type) {
      case 'SYNC_COMPLETED':
        this.handleSyncCompleted(data);
        break;
      case 'SYNC_FAILED':
        this.handleSyncFailed(data);
        break;
      case 'CONFLICT_DETECTED':
        this.handleConflict(data);
        break;
    }
  }

  public async queueChange(operation: SyncQueue['operation'], entity: string, data: any): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const syncItem: SyncQueue = {
      id: uuidv4(),
      operation,
      entity,
      data,
      timestamp: new Date().toISOString(),
      status: 'pending',
      retryCount: 0
    };

    await this.db.add('syncQueue', syncItem);
    this.triggerSync();
  }

  private async triggerSync() {
    if (!navigator.onLine) {
      console.log('Device is offline, sync queued for later');
      return;
    }

    const pendingItems = await this.getPendingItems();
    if (pendingItems.length > 0) {
      this.syncWorker?.postMessage({
        type: 'START_SYNC',
        data: {
          items: pendingItems,
          config: this.config
        }
      });
    }
  }

  private async getPendingItems(): Promise<SyncQueue[]> {
    if (!this.db) return [];
    
    const tx = this.db.transaction('syncQueue', 'readonly');
    const store = tx.objectStore('syncQueue');
    return store.getAll();
  }

  private async handleSyncCompleted(data: { id: string }) {
    if (!this.db) return;

    const tx = this.db.transaction('syncQueue', 'readwrite');
    const store = tx.objectStore('syncQueue');
    await store.delete(data.id);
  }

  private async handleSyncFailed(data: { id: string, error: string }) {
    if (!this.db) return;

    const tx = this.db.transaction('syncQueue', 'readwrite');
    const store = tx.objectStore('syncQueue');
    const item = await store.get(data.id);

    if (item && item.retryCount < this.config.retryAttempts) {
      item.retryCount++;
      item.status = 'pending';
      await store.put(item);
      setTimeout(() => this.triggerSync(), this.config.syncInterval);
    } else {
      item.status = 'failed';
      await store.put(item);
      // Notify user of sync failure
      this.notifyUser('Sync failed', `Failed to sync ${item.entity} after ${this.config.retryAttempts} attempts`);
    }
  }

  private async handleConflict(data: { id: string, serverData: any, clientData: any }) {
    if (this.config.conflictResolution === 'server') {
      await this.resolveConflict(data.id, data.serverData);
    } else if (this.config.conflictResolution === 'manual') {
      // Show conflict resolution UI to user
      this.showConflictResolutionUI(data);
    }
  }

  private async resolveConflict(id: string, resolvedData: any) {
    if (!this.db) return;

    const tx = this.db.transaction('offlineData', 'readwrite');
    const store = tx.objectStore('offlineData');
    await store.put({ id, ...resolvedData });
  }

  private notifyUser(title: string, message: string) {
    // Implement notification logic (can use the notification system we'll build later)
    console.log(`${title}: ${message}`);
  }

  private showConflictResolutionUI(data: { id: string, serverData: any, clientData: any }) {
    // Implement conflict resolution UI logic
    console.log('Conflict detected:', data);
  }

  // Public methods for manual sync control
  public async forceSyncAll(): Promise<void> {
    this.triggerSync();
  }

  public async getFailedSyncs(): Promise<SyncQueue[]> {
    if (!this.db) return [];

    const tx = this.db.transaction('syncQueue', 'readonly');
    const store = tx.objectStore('syncQueue');
    return (await store.getAll()).filter(item => item.status === 'failed');
  }

  public async retrySyncItem(id: string): Promise<void> {
    if (!this.db) return;

    const tx = this.db.transaction('syncQueue', 'readwrite');
    const store = tx.objectStore('syncQueue');
    const item = await store.get(id);

    if (item) {
      item.status = 'pending';
      item.retryCount = 0;
      await store.put(item);
      this.triggerSync();
    }
  }

  private async syncCreate(entityType: string, data: any): Promise<void> {
    const response = await fetch(`/api/${entityType}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create ${entityType}`);
    }
  }

  private async syncUpdate(entityType: string, data: any): Promise<void> {
    const response = await fetch(`/api/${entityType}/${data.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update ${entityType}`);
    }
  }

  private async syncDelete(entityType: string, id: string): Promise<void> {
    const response = await fetch(`/api/${entityType}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete ${entityType}`);
    }
  }

  async retrySync(syncId: string): Promise<void> {
    try {
      const db = await window.electronAPI.getDB();
      const failedSync = await db.getFailedSync(syncId);
      if (!failedSync) {
        throw new Error('Failed sync not found');
      }
      
      // Type assertion to ensure TypeScript knows failedSync has the required properties
      const syncData = failedSync as unknown as {
        operation: 'create' | 'update' | 'delete';
        entity: string;
        data: any;
      };
      
      // Attempt to resync based on the operation type
      switch (syncData.operation) {
        case 'create':
          await this.syncCreate(syncData.entity, syncData.data);
          break;
        case 'update':
          await this.syncUpdate(syncData.entity, syncData.data);
          break;
        case 'delete':
          await this.syncDelete(syncData.entity, syncData.data.id);
          break;
        default:
          throw new Error('Unknown sync operation');
      }

      // Remove the failed sync record after successful retry
      await db.removeFailedSync(syncId);
    } catch (error) {
      console.error('Failed to retry sync:', error);
      throw error;
    }
  }
}

export const syncService = new SyncService();
export default syncService; 