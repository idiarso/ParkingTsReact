import { configureStore } from '@reduxjs/toolkit';
import parkingSessionsReducer from './slices/parkingSessionsSlice';
import vehiclesReducer from './slices/vehiclesSlice';
import settingsReducer from './slices/settingsSlice';

export const store = configureStore({
  reducer: {
    parkingSessions: parkingSessionsReducer,
    vehicles: vehiclesReducer,
    settings: settingsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 