import { SyncQueue, SyncConfig } from '../src/services/syncService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

interface SyncWorkerMessage {
  type: string;
  data: {
    items: SyncQueue[];
    config: SyncConfig;
  };
}

self.onmessage = async (event: MessageEvent<SyncWorkerMessage>) => {
  if (event.data.type === 'START_SYNC') {
    const { items, config } = event.data.data;
    for (const item of items) {
      try {
        await syncItem(item, config);
        self.postMessage({ type: 'SYNC_COMPLETED', data: { id: item.id } });
      } catch (error) {
        if (error.name === 'ConflictError') {
          self.postMessage({
            type: 'CONFLICT_DETECTED',
            data: {
              id: item.id,
              serverData: error.serverData,
              clientData: item.data
            }
          });
        } else {
          self.postMessage({
            type: 'SYNC_FAILED',
            data: {
              id: item.id,
              error: error.message
            }
          });
        }
      }
    }
  }
};

async function syncItem(item: SyncQueue, config: SyncConfig): Promise<void> {
  const endpoint = `${API_BASE_URL}/${item.entity}`;
  const headers = {
    'Content-Type': 'application/json',
    // Add authentication headers if needed
  };

  let response;
  switch (item.operation) {
    case 'CREATE':
      response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(item.data)
      });
      break;

    case 'UPDATE':
      response = await fetch(`${endpoint}/${item.data.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(item.data)
      });
      break;

    case 'DELETE':
      response = await fetch(`${endpoint}/${item.data.id}`, {
        method: 'DELETE',
        headers
      });
      break;

    default:
      throw new Error(`Unknown operation: ${item.operation}`);
  }

  if (!response.ok) {
    if (response.status === 409) {
      const serverData = await response.json();
      throw new ConflictError('Data conflict detected', serverData);
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }
}

class ConflictError extends Error {
  constructor(message: string, public serverData: any) {
    super(message);
    this.name = 'ConflictError';
  }
}

// Listen for online/offline events
self.addEventListener('online', () => {
  self.postMessage({ type: 'ONLINE' });
});

self.addEventListener('offline', () => {
  self.postMessage({ type: 'OFFLINE' });
}); 