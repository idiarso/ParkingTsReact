import { Router } from 'express';
import { ParkingSession, Vehicle, Rate } from '../entities';
import { AppDataSource } from '../config/database';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { IsNull } from 'typeorm';

const router = Router();
const parkingRepository = AppDataSource.getRepository(ParkingSession);
const vehicleRepository = AppDataSource.getRepository(Vehicle);
const rateRepository = AppDataSource.getRepository(Rate);

// Start parking session
router.post('/entry', authenticate, async (req, res, next) => {
  try {
    const { licensePlate, vehicleType, imageUrl } = req.body;

    // Find or create vehicle
    let vehicle = await vehicleRepository.findOne({
      where: { licensePlate }
    });

    if (!vehicle) {
      vehicle = vehicleRepository.create({
        licensePlate,
        vehicleType,
        imageUrl,
        isParked: true
      });
      await vehicleRepository.save(vehicle);
    } else if (vehicle.isParked) {
      throw new AppError(400, 'Vehicle is already parked');
    }

    // Generate ticket number
    const ticketNumber = `PKR${Date.now()}`;

    // Create parking session
    const parkingSession = parkingRepository.create({
      vehicle,
      ticketNumber,
      entryTime: new Date()
    });

    await parkingRepository.save(parkingSession);
    res.status(201).json(parkingSession);
  } catch (error) {
    next(error);
  }
});

// End parking session
router.post('/exit', authenticate, async (req, res, next) => {
  try {
    const { ticketNumber } = req.body;

    const parkingSession = await parkingRepository.findOne({
      where: { ticketNumber },
      relations: ['vehicle']
    });

    if (!parkingSession) {
      throw new AppError(404, 'Parking session not found');
    }

    if (parkingSession.exitTime) {
      throw new AppError(400, 'Parking session already ended');
    }

    // Calculate parking duration and fee
    const exitTime = new Date();
    const duration = exitTime.getTime() - parkingSession.entryTime.getTime();
    const hours = Math.ceil(duration / (1000 * 60 * 60));

    const rate = await rateRepository.findOne({
      where: { vehicleType: parkingSession.vehicle.vehicleType }
    });

    if (!rate) {
      throw new AppError(404, 'Rate not found for vehicle type');
    }

    const fee = rate.baseRate + (hours * rate.hourlyRate);

    // Update parking session
    parkingSession.exitTime = exitTime;
    parkingSession.fee = fee;
    await parkingRepository.save(parkingSession);

    // Update vehicle status
    parkingSession.vehicle.isParked = false;
    await vehicleRepository.save(parkingSession.vehicle);

    res.json(parkingSession);
  } catch (error) {
    next(error);
  }
});

// Get active parking sessions
router.get('/active', authenticate, async (_req, res, next) => {
  try {
    const sessions = await parkingRepository.find({
      where: { exitTime: IsNull() },
      relations: ['vehicle', 'vehicle.owner'],
    });
    res.json(sessions);
  } catch (error) {
    next(error);
  }
});

// Get parking session by ticket number
router.get('/:ticketNumber', authenticate, async (req, res, next) => {
  try {
    const session = await parkingRepository.findOne({
      where: { ticketNumber: req.params.ticketNumber },
      relations: ['vehicle']
    });

    if (!session) {
      throw new AppError(404, 'Parking session not found');
    }

    res.json(session);
  } catch (error) {
    next(error);
  }
});

export default router; 