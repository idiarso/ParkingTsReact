import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Vehicle } from '../entities';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();
const vehicleRepository = AppDataSource.getRepository(Vehicle);

// Get all vehicles
router.get('/', authenticate, async (_req, res, next) => {
  try {
    const vehicles = await vehicleRepository.find();
    res.json(vehicles);
  } catch (error) {
    next(error);
  }
});

// Get vehicle by license plate
router.get('/:licensePlate', authenticate, async (req, res, next) => {
  try {
    const vehicle = await vehicleRepository.findOne({
      where: { licensePlate: req.params.licensePlate }
    });

    if (!vehicle) {
      throw new AppError(404, 'Vehicle not found');
    }

    res.json(vehicle);
  } catch (error) {
    next(error);
  }
});

// Register new vehicle
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { licensePlate, vehicleType, imageUrl } = req.body;

    const existingVehicle = await vehicleRepository.findOne({
      where: { licensePlate }
    });

    if (existingVehicle) {
      throw new AppError(400, 'Vehicle already registered');
    }

    const vehicle = vehicleRepository.create({
      licensePlate,
      vehicleType,
      imageUrl
    });

    await vehicleRepository.save(vehicle);
    res.status(201).json(vehicle);
  } catch (error) {
    next(error);
  }
});

// Update vehicle status
router.patch('/:licensePlate/status', authenticate, async (req, res, next) => {
  try {
    const { isParked } = req.body;
    const vehicle = await vehicleRepository.findOne({
      where: { licensePlate: req.params.licensePlate }
    });

    if (!vehicle) {
      throw new AppError(404, 'Vehicle not found');
    }

    vehicle.isParked = isParked;
    await vehicleRepository.save(vehicle);
    res.json(vehicle);
  } catch (error) {
    next(error);
  }
});

export default router; 