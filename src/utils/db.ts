import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { ParkingDB, ParkingSession, Vehicle, Settings } from '../store/types';

export interface MyDB extends DBSchema {
  parkingSessions: {
    key: string;
    value: ParkingSession;
    indexes: {
      'by-status': string;
    };
  };
  vehicles: {
    key: string;
    value: Vehicle;
  };
  settings: {
    key: string;
    value: Settings;
  };
}

let dbPromise: Promise<IDBPDatabase<MyDB>>;

export const getDB = async () => {
  if (!dbPromise) {
    dbPromise = openDB<MyDB>('parking-system', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('parkingSessions')) {
          const store = db.createObjectStore('parkingSessions', { keyPath: 'id' });
          store.createIndex('by-status', 'status');
        }
        if (!db.objectStoreNames.contains('vehicles')) {
          db.createObjectStore('vehicles', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
};

export const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Vehicle operations
export async function addVehicle(vehicle: Vehicle) {
  const db = await getDB();
  await db.add('vehicles', vehicle);
}

export async function updateVehicle(vehicle: Vehicle) {
  const db = await getDB();
  await db.put('vehicles', vehicle);
}

export async function getVehicle(id: string) {
  const db = await getDB();
  return db.get('vehicles', id);
}

export async function getAllVehicles() {
  const db = await getDB();
  return db.getAll('vehicles');
}

// Parking session operations
export async function addParkingSession(session: ParkingSession) {
  const db = await getDB();
  await db.add('parkingSessions', session);
}

export async function updateParkingSession(session: ParkingSession) {
  const db = await getDB();
  await db.put('parkingSessions', session);
}

export async function getActiveSessions() {
  const db = await getDB();
  return db.getAllFromIndex('parkingSessions', 'by-status', 'active');
}

// Settings operations
export async function getSetting(id: string) {
  const db = await getDB();
  return db.get('settings', id);
}

export async function updateSetting(setting: Settings) {
  const db = await getDB();
  await db.put('settings', setting);
} 