export interface ParkingRate {
  vehicleType: string;
  baseRate: number;
  hourlyRate: number;
}

export interface Settings {
  parkingRates: ParkingRate[];
  openingTime: string;
  closingTime: string;
  maxCapacity: number;
  enableOvernight: boolean;
}

export interface SettingsState {
  settings: Settings | null;
  loading: boolean;
  error: string | null;
} 