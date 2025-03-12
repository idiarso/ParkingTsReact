import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppThunk } from '../types';
import { ParkingSessionsState, ParkingSession } from '../types';
import { getDB } from '../../utils/db';
import { calculateParkingFee } from '../../utils/fees';

const initialState: ParkingSessionsState = {
  sessions: [],
  loading: false,
  error: null,
  lastSync: undefined,
  syncQueue: [],
  isOnline: true,
};

const parkingSessionsSlice = createSlice({
  name: 'parkingSessions',
  initialState,
  reducers: {
    setParkingSessions: (state, action: PayloadAction<ParkingSession[]>) => {
      state.sessions = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
      state.error = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    updateSession: (state, action: PayloadAction<ParkingSession>) => {
      const index = state.sessions.findIndex((session) => session.id === action.payload.id);
      if (index !== -1) {
        state.sessions[index] = action.payload;
      }
    },
    setLastSync: (state, action: PayloadAction<string>) => {
      state.lastSync = action.payload;
    },
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    addToSyncQueue: (state, action: PayloadAction<string>) => {
      if (!state.syncQueue.includes(action.payload)) {
        state.syncQueue.push(action.payload);
      }
    },
    removeFromSyncQueue: (state, action: PayloadAction<string>) => {
      state.syncQueue = state.syncQueue.filter(id => id !== action.payload);
    },
  },
});

export const {
  setParkingSessions,
  setLoading,
  setError,
  updateSession,
  setLastSync,
  setOnlineStatus,
  addToSyncQueue,
  removeFromSyncQueue,
} = parkingSessionsSlice.actions;

// Load sessions with offline support
export const loadActiveSessions = (): AppThunk => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const db = await getDB();
    
    // First load from IndexedDB
    const sessions = await db.getAll('parkingSessions');
    dispatch(setParkingSessions(sessions));

    // If online, try to sync with server
    if (navigator.onLine) {
      try {
        const electronAPI = window.electronAPI;
        if (electronAPI) {
          const serverSessions = await electronAPI.getDB().then(db => db.getAllParkingSessions());
          
          // Merge with local data, preferring newer changes
          const mergedSessions = mergeSessionData(sessions, serverSessions);
          
          // Update each session individually in IndexedDB
          for (const session of mergedSessions) {
            await db.put('parkingSessions', session);
          }
          
          dispatch(setParkingSessions(mergedSessions));
          dispatch(setLastSync(new Date().toISOString()));
        }
      } catch (syncError) {
        console.warn('Failed to sync with server:', syncError);
        // Continue with local data
      }
    }
  } catch (error) {
    dispatch(setError(error instanceof Error ? error.message : 'Failed to load sessions'));
  } finally {
    dispatch(setLoading(false));
  }
};

// End session with offline support
export const endSession = (sessionId: string): AppThunk => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const db = await getDB();
    const session = await db.get('parkingSessions', sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }

    const exitTime = new Date().toISOString();
    const totalAmount = calculateParkingFee(new Date(session.entryTime), new Date(exitTime));

    const updatedSession: ParkingSession = {
      ...session,
      exitTime,
      totalAmount,
      status: 'completed',
      lastSynced: undefined,
    };

    // Save locally first
    await db.put('parkingSessions', updatedSession);
    dispatch(updateSession(updatedSession));
    
    // Try to sync immediately if online
    if (navigator.onLine) {
      try {
        const electronAPI = window.electronAPI;
        if (electronAPI) {
          await electronAPI.getDB().then(db => db.endParkingSession(sessionId));
          updatedSession.lastSynced = new Date().toISOString();
          await db.put('parkingSessions', updatedSession);
          dispatch(updateSession(updatedSession));
          dispatch(setLastSync(new Date().toISOString()));
        }
      } catch (syncError) {
        console.warn('Failed to sync session end:', syncError);
        dispatch(addToSyncQueue(sessionId));
      }
    } else {
      dispatch(addToSyncQueue(sessionId));
    }
  } catch (error) {
    dispatch(setError(error instanceof Error ? error.message : 'Failed to end session'));
  } finally {
    dispatch(setLoading(false));
  }
};

// Helper function to merge local and server data
const mergeSessionData = (localSessions: ParkingSession[], serverSessions: ParkingSession[]): ParkingSession[] => {
  const merged = new Map<string, ParkingSession>();
  
  // Add all local sessions
  localSessions.forEach(session => {
    merged.set(session.id, session);
  });
  
  // Merge with server sessions, preferring newer data
  serverSessions.forEach(serverSession => {
    const localSession = merged.get(serverSession.id);
    if (!localSession || !localSession.lastSynced || 
        (serverSession.lastSynced && new Date(serverSession.lastSynced) > new Date(localSession.lastSynced))) {
      merged.set(serverSession.id, serverSession);
    }
  });
  
  return Array.from(merged.values());
};

export default parkingSessionsSlice.reducer; 