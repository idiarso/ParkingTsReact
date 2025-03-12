import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { ParkingSession } from '../entities/ParkingSession';
import { ParkingRate } from '../entities/ParkingRate';
import { logger } from '../utils/logger';
import { ReceiptController } from './ReceiptController';
import { Receipt } from '../entities/Receipt';

export class ParkingController {
  private calculateParkingFee(
    entryTime: Date,
    exitTime: Date,
    rate: ParkingRate,
    isOvernight: boolean = false
  ): { fee: number; overnightSurcharge: number } {
    const durationMs = exitTime.getTime() - entryTime.getTime();
    const durationMinutes = Math.ceil(durationMs / (1000 * 60));

    // Apply grace period
    if (durationMinutes <= rate.gracePeriodMinutes) {
      return { fee: 0, overnightSurcharge: 0 };
    }

    const durationHours = Math.ceil(durationMinutes / 60);
    const baseFee = rate.baseRate + (durationHours - 1) * rate.hourlyRate;

    // Apply overnight surcharge if applicable
    const overnightSurcharge = isOvernight ? baseFee * 0.2 : 0;

    return { fee: baseFee, overnightSurcharge };
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
        plateNumber,
        vehicleType,
        driverName,
        driverPhone,
        notes,
        parkingSpot,
        entryGateNumber,
        entryPhotoUrl
      } = req.body;

      // Enhanced validation
      if (!plateNumber || !vehicleType) {
        return res.status(400).json({
          success: false,
          message: 'Plate number and vehicle type are required'
        });
      }

      if (!this.validatePlateNumber(plateNumber)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid plate number format'
        });
      }

      if (driverPhone && !this.validatePhoneNumber(driverPhone)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number format'
        });
      }

      // Validate vehicle type against available rates
      const rateRepo = getRepository(ParkingRate);
      const validRate = await rateRepo.findOne({
        where: {
          vehicleType,
          isActive: true
        }
      });

      if (!validRate) {
        return res.status(400).json({
          success: false,
          message: 'Invalid vehicle type'
        });
      }

      // Check if vehicle is already parked
      const parkingRepo = getRepository(ParkingSession);
      const existingSession = await parkingRepo.findOne({
        where: {
          plateNumber,
          isCompleted: false
        }
      });

      if (existingSession) {
        return res.status(400).json({
          success: false,
          message: 'Vehicle is already parked'
        });
      }

      // Create new parking session with additional details
      const session = parkingRepo.create({
        plateNumber: plateNumber.toUpperCase(),
        vehicleType,
        driverName,
        driverPhone,
        notes,
        parkingSpot,
        entryGateNumber,
        entryPhotoUrl,
        entryTime: new Date()
      });

      await parkingRepo.save(session);

      logger.info(`Vehicle entered: ${plateNumber}, Spot: ${parkingSpot}`);

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
        plateNumber,
        exitGateNumber,
        exitPhotoUrl,
        paymentMethod,
        paymentReference,
        customerEmail
      } = req.body;

      const parkingRepo = getRepository(ParkingSession);
      const session = await parkingRepo.findOne({
        where: {
          plateNumber,
          isCompleted: false
        }
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'No active parking session found'
        });
      }

      const rateRepo = getRepository(ParkingRate);
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

      const exitTime = new Date();
      const durationHours = (exitTime.getTime() - session.entryTime.getTime()) / (1000 * 60 * 60);
      const isOvernight = durationHours >= 24;

      const { fee, overnightSurcharge } = this.calculateParkingFee(
        session.entryTime,
        exitTime,
        rate,
        isOvernight
      );

      // Update session with exit details
      session.exitTime = exitTime;
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

      await parkingRepo.save(session);

      // Generate receipt
      const receiptRepo = getRepository(Receipt);
      const receiptController = new ReceiptController();
      const receipt = await receiptRepo.create({
        receiptNumber: receiptController['generateReceiptNumber'](),
        parkingSession: session,
        parkingSessionId: session.id,
        subtotal: fee,
        overnightSurcharge: overnightSurcharge,
        total: fee + overnightSurcharge,
        paymentMethod,
        paymentReference,
        customerName: session.driverName,
        customerPhone: session.driverPhone,
        customerEmail,
        vehicleType: session.vehicleType,
        plateNumber: session.plateNumber,
        entryTime: session.entryTime,
        exitTime: session.exitTime,
        duration: receiptController['calculateDuration'](session.entryTime, exitTime),
        baseRate: rate.baseRate,
        hourlyRate: rate.hourlyRate
      });

      await receiptRepo.save(receipt);

      logger.info(`Vehicle exited: ${plateNumber}, Fee: ${fee}, Surcharge: ${overnightSurcharge}`);

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
      const { plateNumber } = req.params;

      const parkingRepo = getRepository(ParkingSession);
      const session = await parkingRepo.findOne({
        where: {
          plateNumber,
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
      const rateRepo = getRepository(ParkingRate);
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
      const parkingRepo = getRepository(ParkingSession);

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
      const parkingRepo = getRepository(ParkingSession);
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