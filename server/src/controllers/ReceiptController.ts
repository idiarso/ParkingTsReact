import { Request, Response } from 'express';
import { Between } from 'typeorm';
import { Receipt } from '../entities/Receipt';
import { ParkingSession } from '../entities/ParkingSession';
import { ParkingRate } from '../entities/ParkingRate';
import { AppDataSource } from '../config/database';
import { logger } from '../utils/logger';
import { ReceiptGenerator } from '../utils/receiptGenerator';
import { ReceiptFormat, BatchDownloadOptions } from '../types/receipt';
import archiver from 'archiver';

export class ReceiptController {
  private receiptRepo = AppDataSource.getRepository(Receipt);
  private parkingRepo = AppDataSource.getRepository(ParkingSession);

  generateReceiptNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `RCP${timestamp}${random}`;
  }

  calculateDuration(entryTime: Date, exitTime: Date): string {
    const durationMs = exitTime.getTime() - entryTime.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }

  async generateReceipt(req: Request, res: Response) {
    try {
      const { parkingSessionId } = req.params;
      const { customerEmail } = req.body as { customerEmail?: string; format?: ReceiptFormat };

      const parkingRepo = AppDataSource.getRepository(ParkingSession);
      const rateRepo = AppDataSource.getRepository(ParkingRate);
      const receiptRepo = AppDataSource.getRepository(Receipt);

      const session = await parkingRepo.findOne({
        where: { id: parkingSessionId }
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Parking session not found'
        });
      }

      if (!session.isCompleted) {
        return res.status(400).json({
          success: false,
          message: 'Cannot generate receipt for active parking session'
        });
      }

      // Check if receipt already exists
      const existingReceipt = await receiptRepo.findOne({
        where: { parkingSessionId }
      });

      if (existingReceipt) {
        return res.status(200).json({
          success: true,
          data: existingReceipt
        });
      }

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

      const receipt = receiptRepo.create({
        receiptNumber: this.generateReceiptNumber(),
        parkingSession: session,
        parkingSessionId: session.id,
        subtotal: session.parkingFee,
        overnightSurcharge: session.overnightSurcharge || 0,
        total: (session.parkingFee || 0) + (session.overnightSurcharge || 0),
        paymentMethod: session.paymentMethod,
        paymentReference: session.paymentReference,
        customerName: session.driverName,
        customerPhone: session.driverPhone,
        customerEmail,
        vehicleType: session.vehicleType,
        licensePlate: session.licensePlate,
        entryTime: session.entryTime,
        endTime: session.endTime,
        duration: this.calculateDuration(session.entryTime, session.endTime),
        baseRate: rate.baseRate,
        hourlyRate: rate.hourlyRate
      });

      await receiptRepo.save(receipt);

      logger.info(`Receipt generated: ${receipt.receiptNumber} for session ${parkingSessionId}`);

      return res.status(201).json({
        success: true,
        data: receipt
      });
    } catch (error) {
      logger.error('Error generating receipt:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async downloadBatch(req: Request, res: Response) {
    try {
      const options: BatchDownloadOptions = req.body;
      const receiptRepo = AppDataSource.getRepository(Receipt);

      // Build query conditions
      const where: any = {};

      if (options.dateRange) {
        where.createdAt = Between(options.dateRange.start, options.dateRange.end);
      }

      if (options.plateNumber) {
        where.plateNumber = options.plateNumber;
      }

      if (options.vehicleType) {
        where.vehicleType = options.vehicleType;
      }

      // Get receipts
      const receipts = await receiptRepo.find({
        where,
        order: {
          [options.sortBy || 'createdAt']: options.sortOrder || 'desc'
        }
      });

      if (receipts.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No receipts found matching the criteria'
        });
      }

      // Create zip archive
      const archive = archiver('zip', {
        zlib: { level: 9 }
      });

      // Set response headers
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename=receipts-${Date.now()}.zip`);

      // Pipe archive to response
      archive.pipe(res);

      // Generate and add files to archive
      for (const receipt of receipts) {
        if (options.format === 'pdf') {
          const pdfBuffer = await ReceiptGenerator.generatePDF(receipt, options.receiptFormat);
          archive.append(pdfBuffer, { name: `receipt-${receipt.receiptNumber}.pdf` });
        } else {
          const excelBuffer = ReceiptGenerator.generateExcel(receipt, options.receiptFormat);
          archive.append(excelBuffer, { name: `receipt-${receipt.receiptNumber}.xlsx` });
        }
      }

      // Finalize archive
      await archive.finalize();

      logger.info(`Batch download completed: ${receipts.length} receipts`);
      return res.status(200).send('Batch download completed');
    } catch (error) {
      logger.error('Error generating batch download:', error);
      return res.status(500).json({
        success: false,
        message: 'Error generating batch download'
      });
    }
  }

  async getReceipt(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const receipt = await this.receiptRepo.findOne({
        where: { id },
        relations: ['parkingSession']
      });

      if (!receipt) {
        return res.status(404).json({
          success: false,
          message: 'Receipt not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: receipt
      });
    } catch (error) {
      logger.error('Error getting receipt:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async getReceiptBySession(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const receipt = await this.receiptRepo.findOne({
        where: { parkingSessionId: sessionId },
        relations: ['parkingSession']
      });

      if (!receipt) {
        return res.status(404).json({
          success: false,
          message: 'Receipt not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: receipt
      });
    } catch (error) {
      logger.error('Error getting receipt by session:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async getVehicleHistory(req: Request, res: Response) {
    try {
      const { licensePlate } = req.params;
      const sessions = await this.parkingRepo.find({
        where: { licensePlate },
        relations: ['receipt'],
        order: { entryTime: 'DESC' }
      });

      return res.status(200).json({
        success: true,
        data: sessions
      });
    } catch (error) {
      logger.error('Error getting vehicle history:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async getUserReceipts(req: Request, res: Response) {
    try {
      const { licensePlate, limit = 10, offset = 0 } = req.query;
      const receiptRepo = AppDataSource.getRepository(Receipt);

      const [receipts, total] = await receiptRepo.findAndCount({
        where: { licensePlate: licensePlate as string },
        order: { createdAt: 'DESC' },
        take: Math.min(Number(limit), 50),
        skip: Number(offset)
      });

      return res.status(200).json({
        success: true,
        data: {
          receipts,
          total,
          limit: Number(limit),
          offset: Number(offset)
        }
      });
    } catch (error) {
      logger.error('Error retrieving user receipts:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
} 