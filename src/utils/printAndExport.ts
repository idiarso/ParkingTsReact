import { format } from 'date-fns';
import { getDB } from './db';
import { ExportData, Settings, ParkingSession, Vehicle } from '../store/types';
import { IDBPDatabase } from 'idb';
import { MyDB } from './db';

type StoreNames = 'parkingSessions' | 'vehicles' | 'settings';

export const printReceipt = (receiptElement: HTMLElement) => {
  const originalContents = document.body.innerHTML;
  const printContents = receiptElement.innerHTML;

  document.body.innerHTML = printContents;
  window.print();
  document.body.innerHTML = originalContents;
};

export const exportDataToJson = (data: ExportData): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `parking-system-backup-${new Date().toISOString()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const importDataFromJson = async (file: File): Promise<ExportData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        resolve(data as ExportData);
      } catch (error) {
        reject(new Error('Invalid backup file format'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read backup file'));
    reader.readAsText(file);
  });
};

export const downloadCsv = (data: Record<string, any>[], filename: string): void => {
  if (data.length === 0) return;

  // Get headers from the first object
  const headers = Object.keys(data[0]);
  
  // Convert data to CSV format
  const csvContent = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle special cases (dates, objects, etc.)
        if (value instanceof Date) {
          return format(value, 'yyyy-MM-dd HH:mm:ss');
        }
        if (typeof value === 'object') {
          return JSON.stringify(value).replace(/"/g, '""');
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = `${filename}-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const createBackup = async (db: IDBPDatabase<MyDB>): Promise<ExportData> => {
  const data: ExportData = {
    parkingSessions: [],
    vehicles: [],
    settings: {} as Settings
  };

  const stores: StoreNames[] = ['parkingSessions', 'vehicles', 'settings'];

  for (const store of stores) {
    const objectStore = db.transaction(store).objectStore(store);
    const items = await objectStore.getAll();
    
    switch (store) {
      case 'settings':
        data.settings = items[0] as Settings;
        break;
      case 'parkingSessions':
        data.parkingSessions = items as ParkingSession[];
        break;
      case 'vehicles':
        data.vehicles = items as Vehicle[];
        break;
    }
  }

  return data;
};

export const restoreBackup = async (db: IDBPDatabase<MyDB>, data: ExportData): Promise<void> => {
  const stores: StoreNames[] = ['parkingSessions', 'vehicles', 'settings'];

  // Clear and restore each store
  for (const store of stores) {
    const transaction = db.transaction(store, 'readwrite');
    const objectStore = transaction.objectStore(store);
    await objectStore.clear();
    
    switch (store) {
      case 'settings':
        await objectStore.add(data.settings);
        break;
      case 'parkingSessions':
        for (const session of data.parkingSessions) {
          await objectStore.add(session);
        }
        break;
      case 'vehicles':
        for (const vehicle of data.vehicles) {
          await objectStore.add(vehicle);
        }
        break;
    }
  }
}; 