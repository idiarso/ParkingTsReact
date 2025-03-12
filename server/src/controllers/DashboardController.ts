import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { Session } from '../entities/Session';
import { Vehicle } from '../entities/Vehicle';
import { AppError } from '../utils/AppError';
import { Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

export class DashboardController {
  // Get real-time parking statistics
  static async getStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const sessionRepo = AppDataSource.getRepository(Session);
      const vehicleRepo = AppDataSource.getRepository(Vehicle);

      // Get current active sessions
      const activeSessions = await sessionRepo.count({
        where: {
          exitTime: null
        }
      });

      // Get total capacity from settings (hardcoded for now)
      const totalCapacity = 100;
      
      // Calculate occupancy rate
      const occupancyRate = (activeSessions / totalCapacity) * 100;

      // Get today's revenue
      const today = new Date();
      const todayStart = startOfDay(today);
      const todayEnd = endOfDay(today);

      const todaySessions = await sessionRepo.find({
        where: {
          exitTime: Between(todayStart, todayEnd)
        }
      });

      const todayRevenue = todaySessions.reduce((sum, session) => sum + (session.fee || 0), 0);

      // Get vehicle type distribution
      const vehicles = await vehicleRepo.find();
      const vehicleTypes = vehicles.reduce((acc: { [key: string]: number }, vehicle) => {
        acc[vehicle.type] = (acc[vehicle.type] || 0) + 1;
        return acc;
      }, {});

      // Get recent entries/exits (last 5)
      const recentSessions = await sessionRepo.find({
        relations: ['vehicle'],
        order: {
          entryTime: 'DESC'
        },
        take: 5
      });

      // Get daily revenue for the last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(today, i);
        return {
          date: format(date, 'yyyy-MM-dd'),
          start: startOfDay(date),
          end: endOfDay(date)
        };
      });

      const dailyRevenue = await Promise.all(
        last7Days.map(async ({ date, start, end }) => {
          const sessions = await sessionRepo.find({
            where: {
              exitTime: Between(start, end)
            }
          });
          const revenue = sessions.reduce((sum, session) => sum + (session.fee || 0), 0);
          return { date, revenue };
        })
      );

      res.json({
        currentOccupancy: {
          active: activeSessions,
          total: totalCapacity,
          rate: occupancyRate
        },
        revenue: {
          today: todayRevenue,
          daily: dailyRevenue
        },
        vehicleTypes,
        recentActivity: recentSessions.map(session => ({
          id: session.id,
          vehicleId: session.vehicle.id,
          plateNumber: session.vehicle.plateNumber,
          entryTime: session.entryTime,
          exitTime: session.exitTime,
          fee: session.fee
        }))
      });
    } catch (error) {
      next(new AppError('Error fetching dashboard statistics', 500));
    }
  }
} 