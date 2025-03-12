import { createAsyncThunk } from '@reduxjs/toolkit';
import { AppThunk } from '../types';
import { setParkingSessions, setLoading, setError } from '../reducers/parkingSessionsReducer';
import '../../types/electron';

export const loadActiveSessions = (): AppThunk => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const db = await window.electronAPI.getDB();
    const sessions = await db.getAllParkingSessions();
    dispatch(setParkingSessions(sessions));
  } catch (error) {
    dispatch(setError(error instanceof Error ? error.message : 'Failed to load sessions'));
  }
};

export const endParkingSession = (sessionId: string): AppThunk => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const db = await window.electronAPI.getDB();
    await db.endParkingSession(sessionId);
    dispatch(loadActiveSessions());
  } catch (error) {
    dispatch(setError(error instanceof Error ? error.message : 'Failed to end session'));
  }
}; 