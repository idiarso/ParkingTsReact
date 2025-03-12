import { differenceInHours } from 'date-fns';

export const calculateParkingFee = (entryTime: Date, exitTime: Date): number => {
  const hours = Math.ceil(differenceInHours(exitTime, entryTime));
  const baseRate = 10; // Base rate in dollars
  const hourlyRate = 2; // Hourly rate in dollars

  return baseRate + (hours * hourlyRate);
}; 