import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ParkingSession } from '../types';

interface ParkingSessionsState {
  sessions: ParkingSession[];
  loading: boolean;
  error: string | null;
}

const initialState: ParkingSessionsState = {
  sessions: [],
  loading: false,
  error: null,
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
  },
});

export const { setParkingSessions, setLoading, setError } = parkingSessionsSlice.actions;
export default parkingSessionsSlice.reducer; 