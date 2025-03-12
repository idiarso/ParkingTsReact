// Define the rate structure
export interface ParkingRates {
  baseRate: number;        // Base rate in IDR
  hourlyRate: number;      // Hourly rate in IDR
  dailyMaximum: number;    // Maximum daily rate in IDR
  graceMinutes: number;    // Grace period in minutes
  overnightFee: number;    // Additional fee for overnight parking
}

// Define vehicle entry data structure
export interface VehicleEntry {
  id: string;
  ticketId: string;
  licensePlate: string;
  vehicleType: string;
  entryTime: number;
  image?: string;
  processed: boolean;
  exitTime?: number;
  fee?: number;
}

// Different rates for different vehicle types
const RATES: Record<string, ParkingRates> = {
  CAR: {
    baseRate: 5000,
    hourlyRate: 3000,
    dailyMaximum: 50000,
    graceMinutes: 10,
    overnightFee: 10000
  },
  MOTORCYCLE: {
    baseRate: 2000,
    hourlyRate: 1000,
    dailyMaximum: 20000,
    graceMinutes: 10,
    overnightFee: 5000
  },
  TRUCK: {
    baseRate: 10000,
    hourlyRate: 5000,
    dailyMaximum: 80000,
    graceMinutes: 10,
    overnightFee: 20000
  },
  BUS: {
    baseRate: 8000,
    hourlyRate: 4000,
    dailyMaximum: 70000,
    graceMinutes: 10,
    overnightFee: 15000
  },
  // Default rate for unknown vehicle types
  UNKNOWN: {
    baseRate: 5000,
    hourlyRate: 3000,
    dailyMaximum: 50000,
    graceMinutes: 10,
    overnightFee: 10000
  }
};

// Helper functions for time calculations
const getMinutesDifference = (startDate: number, endDate: number): number => {
  return Math.floor((endDate - startDate) / (1000 * 60));
};

const getHoursDifference = (startDate: number, endDate: number): number => {
  return Math.floor((endDate - startDate) / (1000 * 60 * 60));
};

const getDaysDifference = (startDate: number, endDate: number): number => {
  return Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
};

/**
 * Calculate parking fee based on entry and exit time
 * @param entry Vehicle entry data
 * @param exitTime Exit time in milliseconds (or current time if not specified)
 * @returns The calculated fee in IDR
 */
export const calculateParkingFee = (entry: VehicleEntry, exitTime?: number): number => {
  const exit = exitTime || Date.now();
  const entryDate = new Date(entry.entryTime);
  const exitDate = new Date(exit);
  
  // Get rate for vehicle type, fallback to default if type not found
  const rate = RATES[entry.vehicleType] || RATES.UNKNOWN;
  
  // Calculate duration
  const minutes = getMinutesDifference(entryDate.getTime(), exitDate.getTime());
  
  // Check grace period
  if (minutes <= rate.graceMinutes) {
    return 0; // Within grace period, no charge
  }
  
  // Calculate days
  const days = getDaysDifference(entryDate.getTime(), exitDate.getTime());
  
  // Calculate hours, excluding full days
  const hoursExcludingDays = getHoursDifference(entryDate.getTime(), exitDate.getTime()) - (days * 24);
  
  // Initialize fee with base rate
  let fee = rate.baseRate;
  
  // Add daily charges
  if (days > 0) {
    fee += Math.min(days * rate.dailyMaximum, days * 24 * rate.hourlyRate);
  }
  
  // Add hourly charges for remaining hours
  if (hoursExcludingDays > 0) {
    fee += Math.min(hoursExcludingDays * rate.hourlyRate, rate.dailyMaximum);
  }
  
  // Check for overnight fee (if parking spans 12:00 AM)
  const entryDay = entryDate.getDate();
  const exitDay = exitDate.getDate();
  
  if (entryDay !== exitDay) {
    fee += rate.overnightFee * days;
  }
  
  return fee;
};

/**
 * Format currency in Indonesian Rupiah
 * @param amount Amount in IDR
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

/**
 * Calculate parking duration in a human-readable format
 * @param entry Vehicle entry data
 * @param exitTime Exit time in milliseconds (or current time if not specified)
 * @returns Human-readable duration string
 */
export const calculateDuration = (entry: VehicleEntry, exitTime?: number): string => {
  const exit = exitTime || Date.now();
  const entryDate = new Date(entry.entryTime);
  const exitDate = new Date(exit);
  
  // Calculate days, hours, and minutes
  const days = getDaysDifference(entryDate.getTime(), exitDate.getTime());
  const hours = getHoursDifference(entryDate.getTime(), exitDate.getTime()) - (days * 24);
  const minutes = getMinutesDifference(entryDate.getTime(), exitDate.getTime()) - (days * 24 * 60) - (hours * 60);
  
  // Format duration string
  if (days > 0) {
    return `${days} days, ${hours} hours, ${minutes} minutes`;
  } else if (hours > 0) {
    return `${hours} hours, ${minutes} minutes`;
  } else {
    return `${minutes} minutes`;
  }
};

export default {
  calculateParkingFee,
  formatCurrency,
  calculateDuration
}; 