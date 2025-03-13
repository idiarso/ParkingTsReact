import { Request, Response } from 'express';
import { ParkingSession } from '../entities/ParkingSession';
import { ParkingRate } from '../entities/ParkingRate';
import { Receipt } from '../entities/Receipt';
import { AppDataSource } from '../config/database';
import { logger } from '../utils/logger';
import { ReceiptController } from './ReceiptController';

export class ParkingController {
  private parkingRepo = AppDataSource.getRepository(ParkingSession);
  private rateRepo = AppDataSource.getRepository(ParkingRate);
  private receiptRepo = AppDataSource.getRepository(Receipt);
  private receiptController = new ReceiptController();

  private calculateParkingFee(
    entryTime: Date,
    endTime: Date,
    rate: ParkingRate,
    isOvernight: boolean
  ): { fee: number; overnightSurcharge: number } {
    const durationHours = (endTime.getTime() - entryTime.getTime()) / (1000 * 60 * 60);
    let fee = rate.baseRate;

    if (durationHours > 1) {
      const additionalHours = Math.ceil(durationHours - 1);
      fee += additionalHours * rate.hourlyRate;
    }

    const overnightSurcharge = isOvernight ? rate.overnightSurcharge || 0 : 0;

    return { fee, overnightSurcharge };
  }

  private validatePlateNumber(plateNumber: string): boolean {
    // Basic plate number validation - can be customized based on your country's format
    const plateRegex = /^[A-Z0-9]{4,10}$/;
    return plateRegex.test(plateNumber.toUpperCase());
  }

  private validatePhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    return phoneRegex.test(phone);
  }

  async recordEntry(req: Request, res: Response) {
    try {
      const {
        licensePlate,
        vehicleType,
        entryGateNumber,
        entryPhotoUrl,
        driverName,
        driverPhone
      } = req.body;

      // Check if vehicle is already parked
      const activeSession = await this.parkingRepo.findOne({
        where: {
          licensePlate,
          isCompleted: false
        }
      });

      if (activeSession) {
        return res.status(400).json({
          success: false,
          message: 'Vehicle is already parked'
        });
      }

      // Create new parking session
      const session = this.parkingRepo.create({
        licensePlate: licensePlate.toUpperCase(),
        vehicleType,
        entryPhotoUrl,
        entryTime: new Date()
      });

      await this.parkingRepo.save(session);

      logger.info(`Vehicle entered: ${licensePlate}, Type: ${vehicleType}`);

      return res.status(201).json({
        success: true,
        data: session
      });
    } catch (error) {
      logger.error('Error recording entry:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async processExit(req: Request, res: Response) {
    try {
      const {
        licensePlate,
        exitGateNumber,
        exitPhotoUrl,
        paymentMethod,
        paymentReference,
        customerEmail
      } = req.body;

      const session = await this.parkingRepo.findOne({
        where: {
          licensePlate,
          isCompleted: false
        }
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'No active parking session found'
        });
      }

      const rate = await this.rateRepo.findOne({
        where: {
          vehicleType: session.vehicleType,
          isActive: true
        }
      });

      if (!rate) {
        return res.status(404).json({
          success: false,
          message: 'Parking rate not found'
        });
      }

      const endTime = new Date();
      const durationHours = (endTime.getTime() - session.entryTime.getTime()) / (1000 * 60 * 60);
      const isOvernight = durationHours >= 24;

      const { fee, overnightSurcharge } = this.calculateParkingFee(
        session.entryTime,
        endTime,
        rate,
        isOvernight
      );

      // Update session with exit details
      session.endTime = endTime;
      session.exitGateNumber = exitGateNumber;
      session.exitPhotoUrl = exitPhotoUrl;
      session.parkingFee = fee;
      session.isOvernight = isOvernight;
      session.overnightSurcharge = overnightSurcharge;
      session.isCompleted = true;
      session.isPaid = true;
      session.paymentMethod = paymentMethod;
      session.paymentReference = paymentReference;
      session.paymentTime = new Date();

      await this.parkingRepo.save(session);

      // Generate receipt
      const receipt = this.receiptRepo.create({
        receiptNumber: this.receiptController.generateReceiptNumber(),
        parkingSessionId: session.id,
        parkingSession: session,
        subtotal: fee,
        overnightSurcharge,
        total: fee + overnightSurcharge,
        paymentMethod,
        paymentReference,
        customerEmail,
        vehicleType: session.vehicleType,
        licensePlate: session.licensePlate,
        entryTime: session.entryTime,
        endTime: session.endTime,
        duration: this.receiptController.calculateDuration(session.entryTime, endTime),
        baseRate: rate.baseRate,
        hourlyRate: rate.hourlyRate
      });

      await this.receiptRepo.save(receipt);

      logger.info(`Vehicle exited: ${licensePlate}, Fee: ${fee}, Surcharge: ${overnightSurcharge}`);

      return res.status(200).json({
        success: true,
        data: {
          session,
          receipt
        }
      });
    } catch (error) {
      logger.error('Error processing exit:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async getSessionDetails(req: Request, res: Response) {
    try {
      const { licensePlate } = req.params;

      const parkingRepo = AppDataSource.getRepository(ParkingSession);
      const session = await parkingRepo.findOne({
        where: {
          licensePlate,
          isCompleted: false
        }
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'No active parking session found'
        });
      }

      const now = new Date();
      const rateRepo = AppDataSource.getRepository(ParkingRate);
      const rate = await rateRepo.findOne({
        where: {
          vehicleType: session.vehicleType,
          isActive: true
        }
      });

      if (!rate) {
        return res.status(404).json({
          success: false,
          message: 'Parking rate not found'
        });
      }

      const durationHours = (now.getTime() - session.entryTime.getTime()) / (1000 * 60 * 60);
      const isOvernight = durationHours >= 24;

      const { fee, overnightSurcharge } = this.calculateParkingFee(
        session.entryTime,
        now,
        rate,
        isOvernight
      );

      const durationMs = now.getTime() - session.entryTime.getTime();
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

      return res.status(200).json({
        success: true,
        data: {
          ...session,
          currentDuration: `${hours}h ${minutes}m`,
          estimatedFee: fee,
          potentialOvernightSurcharge: overnightSurcharge,
          isOvernight
        }
      });
    } catch (error) {
      logger.error('Error getting session details:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async getRecentSessions(req: Request, res: Response) {
    try {
      const { status, limit = 10 } = req.query;
      const parkingRepo = AppDataSource.getRepository(ParkingSession);

      const where: any = {};
      if (status === 'active') {
        where.isCompleted = false;
      } else if (status === 'completed') {
        where.isCompleted = true;
      }

      const sessions = await parkingRepo.find({
        where,
        order: {
          createdAt: 'DESC'
        },
        take: Math.min(Number(limit), 50) // Limit maximum results to 50
      });

      return res.status(200).json({
        success: true,
        data: sessions
      });
    } catch (error) {
      logger.error('Error getting recent sessions:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async getStatistics(_req: Request, res: Response) {
    try {
      const parkingRepo = AppDataSource.getRepository(ParkingSession);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        totalActive,
        totalToday,
        totalRevenue,
        revenueToday
      ] = await Promise.all([
        parkingRepo.count({ where: { isCompleted: false } }),
        parkingRepo.count({ where: { createdAt: today } }),
        parkingRepo.createQueryBuilder('session')
          .select('SUM(session.parkingFee)', 'total')
          .where('session.isCompleted = :completed', { completed: true })
          .getRawOne(),
        parkingRepo.createQueryBuilder('session')
          .select('SUM(session.parkingFee)', 'total')
          .where('session.createdAt >= :today', { today })
          .andWhere('session.isCompleted = :completed', { completed: true })
          .getRawOne()
      ]);

      return res.status(200).json({
        success: true,
        data: {
          activeVehicles: totalActive,
          vehiclesToday: totalToday,
          totalRevenue: totalRevenue?.total || 0,
          revenueToday: revenueToday?.total || 0
        }
      });
    } catch (error) {
      logger.error('Error getting statistics:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
} 