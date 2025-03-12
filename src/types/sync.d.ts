export interface SyncQueue {
  id: string;
  operation: 'create' | 'update' | 'delete';
  entity: string;
  data: any;
  timestamp: string;
  status: 'pending' | 'failed' | 'completed';
  retryCount?: number;
}

export interface ParkingSession {
  id: string;
  vehicleId: string;
  entryTime: string;
  exitTime?: string;
  fee?: number;
  status: 'active' | 'completed';
  spaceId: string;
  syncStatus?: 'pending' | 'synced' | 'failed';
}

export interface ParkingSessionsState {
  sessions: ParkingSession[];
  loading: boolean;
  error: string | null;
  isOnline: boolean;
  lastSyncTimestamp: string | null;
  syncQueue: SyncQueue[];
  selectedSession: ParkingSession | null;
  filter: {
    status: string[];
    date: [Date | null, Date | null];
    searchTerm: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
} 