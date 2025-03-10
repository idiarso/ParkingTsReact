"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const entities_1 = require("../entities");
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const typeorm_1 = require("typeorm");
const router = (0, express_1.Router)();
const parkingRepository = database_1.AppDataSource.getRepository(entities_1.ParkingSession);
const vehicleRepository = database_1.AppDataSource.getRepository(entities_1.Vehicle);
const rateRepository = database_1.AppDataSource.getRepository(entities_1.Rate);
router.post('/entry', auth_1.authenticate, async (req, res, next) => {
    try {
        const { licensePlate, vehicleType, imageUrl } = req.body;
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
        }
        else if (vehicle.isParked) {
            throw new errorHandler_1.AppError(400, 'Vehicle is already parked');
        }
        const ticketNumber = `PKR${Date.now()}`;
        const parkingSession = parkingRepository.create({
            vehicle,
            ticketNumber,
            entryTime: new Date()
        });
        await parkingRepository.save(parkingSession);
        res.status(201).json(parkingSession);
    }
    catch (error) {
        next(error);
    }
});
router.post('/exit', auth_1.authenticate, async (req, res, next) => {
    try {
        const { ticketNumber } = req.body;
        const parkingSession = await parkingRepository.findOne({
            where: { ticketNumber },
            relations: ['vehicle']
        });
        if (!parkingSession) {
            throw new errorHandler_1.AppError(404, 'Parking session not found');
        }
        if (parkingSession.exitTime) {
            throw new errorHandler_1.AppError(400, 'Parking session already ended');
        }
        const exitTime = new Date();
        const duration = exitTime.getTime() - parkingSession.entryTime.getTime();
        const hours = Math.ceil(duration / (1000 * 60 * 60));
        const rate = await rateRepository.findOne({
            where: { vehicleType: parkingSession.vehicle.vehicleType }
        });
        if (!rate) {
            throw new errorHandler_1.AppError(404, 'Rate not found for vehicle type');
        }
        const fee = rate.baseRate + (hours * rate.hourlyRate);
        parkingSession.exitTime = exitTime;
        parkingSession.fee = fee;
        await parkingRepository.save(parkingSession);
        parkingSession.vehicle.isParked = false;
        await vehicleRepository.save(parkingSession.vehicle);
        res.json(parkingSession);
    }
    catch (error) {
        next(error);
    }
});
router.get('/active', auth_1.authenticate, async (_req, res, next) => {
    try {
        const sessions = await parkingRepository.find({
            where: { exitTime: (0, typeorm_1.IsNull)() },
            relations: ['vehicle', 'vehicle.owner'],
        });
        res.json(sessions);
    }
    catch (error) {
        next(error);
    }
});
router.get('/:ticketNumber', auth_1.authenticate, async (req, res, next) => {
    try {
        const session = await parkingRepository.findOne({
            where: { ticketNumber: req.params.ticketNumber },
            relations: ['vehicle']
        });
        if (!session) {
            throw new errorHandler_1.AppError(404, 'Parking session not found');
        }
        res.json(session);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=parking.js.map