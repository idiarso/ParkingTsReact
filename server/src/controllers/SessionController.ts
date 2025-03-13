import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { ParkingSession } from '../entities/ParkingSession';
import { io } from '../socket';

export class SessionController {
  private sessionRepository = AppDataSource.getRepository(ParkingSession);

  async createSession(req: Request, res: Response) {
    try {
      const newSession = this.sessionRepository.create(req.body);
      await this.sessionRepository.save(newSession);
      io.emit('sessionUpdate');
      return res.status(201).json(newSession);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create session' });
    }
  }

  async updateSession(req: Request, res: Response) {
    try {
      const session = await this.sessionRepository.findOne({ where: { id: req.params.id } });
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      
      Object.assign(session, req.body);
      await this.sessionRepository.save(session);
      io.emit('sessionUpdate');
      return res.json(session);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update session' });
    }
  }

  async endSession(req: Request, res: Response) {
    try {
      const session = await this.sessionRepository.findOne({ where: { id: req.params.id } });
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      
      session.endTime = new Date();
      await this.sessionRepository.save(session);
      io.emit('sessionUpdate');
      return res.json(session);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to end session' });
    }
  }
} 