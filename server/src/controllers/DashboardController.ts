import { Request, Response } from 'express';
import { getRepository, MoreThanOrEqual } from 'typeorm';
import { ParkingSession } from '../entities/ParkingSession';
import { Vehicle } from '../entities/Vehicle';
import { User } from '../entities/User';

export class DashboardController {
  static async getStatistics(_req: Request, res: Response) {
    try {
      const parkingSessionRepo = getRepository(ParkingSession);
      const vehicleRepo = getRepository(Vehicle);
      const userRepo = getRepository(User);

      const [
        activeSessionsCount,
        totalSessions,
        totalVehicles,
        totalUsers
      ] = await Promise.all([
        parkingSessionRepo.count({ where: { isCompleted: false } }),
        parkingSessionRepo.count(),
        vehicleRepo.count(),
        userRepo.count()
      ]);

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const todaySessions = await parkingSessionRepo.count({
        where: {
          entryTime: MoreThanOrEqual(todayStart)
        }
      });

      res.json({
        activeSessionsCount,
        totalSessions,
        todaySessions,
        totalVehicles,
        totalUsers
      });
    } catch (error) {
      console.error('Error fetching dashboard statistics:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
    }
  }
} 