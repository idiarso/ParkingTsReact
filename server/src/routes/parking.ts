import { Router } from 'express';
import { ParkingSession } from '../entities';
import { AppDataSource } from '../config/database';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { IsNull } from 'typeorm';
import { ParkingController } from '../controllers/ParkingController';

const router = Router();
const parkingRepository = AppDataSource.getRepository(ParkingSession);
const parkingController = new ParkingController();

// Start parking session
router.post('/entry', authenticate, parkingController.recordEntry.bind(parkingController));

// End parking session
router.post('/exit', authenticate, parkingController.processExit.bind(parkingController));

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

// Entry gate endpoints
router.get('/recent-entries', authenticate, parkingController.getRecentSessions.bind(parkingController));

// Exit gate endpoints
router.get('/details/:plateNumber', authenticate, parkingController.getSessionDetails.bind(parkingController));

// Statistics and reporting
router.get('/statistics', authenticate, parkingController.getStatistics.bind(parkingController));
router.get('/sessions', authenticate, parkingController.getRecentSessions.bind(parkingController));

export default router; 