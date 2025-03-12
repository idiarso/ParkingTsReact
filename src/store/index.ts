import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import vehiclesReducer from './slices/vehiclesSlice';
import parkingSessionsReducer from './slices/parkingSessionsSlice';
import settingsReducer from './slices/settingsSlice';
import authReducer from './slices/authSlice';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    vehicles: vehiclesReducer,
    parkingSessions: parkingSessionsReducer,
    settings: settingsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for date objects
        ignoredActions: ['vehicles/setVehicles', 'parkingSessions/setSessions', 'auth/login/fulfilled'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.entryTime', 'payload.exitTime', 'payload.lastSync', 'payload.lastUpdated', 'payload.user.lastLogin'],
        // Ignore these paths in the state
        ignoredPaths: [
          'vehicles.items.entryTime',
          'vehicles.items.lastSync',
          'parkingSessions.items.entryTime',
          'parkingSessions.items.exitTime',
          'parkingSessions.items.lastSync',
          'settings.items.lastUpdated',
          'auth.user.lastLogin',
        ],
      },
    }),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector; 