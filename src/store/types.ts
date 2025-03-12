import { ThunkAction } from '@reduxjs/toolkit';
import { AnyAction } from 'redux';
import { RootState } from './reducers';
import { DBSchema } from 'idb';

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  AnyAction
>;

export interface ParkingSession {
  id: string;
  vehicleNumber: string;
  vehicleType: string;
  entryTime: string;
  exitTime?: string;
  status: 'active' | 'completed';
  totalAmount?: number;
  lastSynced?: string;
}

export interface Vehicle {
  id: string;
  number: string;
  type: string;
  lastSynced?: string;
}

export interface ParkingRate {
  vehicleType: string;
  baseRate: number;
  hourlyRate: number;
}

export interface Settings {
  maxCapacity: number;
  enableOvernight: boolean;
  operatingHours?: {
    open: string;
    close: string;
  };
  parkingRates: ParkingRate[];
  openingTime: string;
  closingTime: string;
  lastSynced?: string;
}

export interface ParkingSessionsState {
  sessions: ParkingSession[];
  loading: boolean;
  error: string | null;
  lastSync?: string;
  syncQueue: string[];  // Array of session IDs that need syncing
  isOnline: boolean;    // Track online/offline status
}

export interface ExportData {
  parkingSessions: ParkingSession[];
  vehicles: Vehicle[];
  settings: Settings;
  startDate?: string;
  endDate?: string;
}

export interface ParkingDB extends DBSchema {
  parkingSessions: {
    key: string;
    value: ParkingSession;
    indexes: {
      'by-status': string;
      'by-lastSynced': string;
    };
  };
  vehicles: {
    key: string;
    value: Vehicle;
    indexes: {
      'by-lastSynced': string;
    };
  };
  settings: {
    key: string;
    value: Settings;
  };
} 