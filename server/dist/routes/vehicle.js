"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const entities_1 = require("../entities");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
const vehicleRepository = database_1.AppDataSource.getRepository(entities_1.Vehicle);
router.get('/', auth_1.authenticate, async (_req, res, next) => {
    try {
        const vehicles = await vehicleRepository.find();
        res.json(vehicles);
    }
    catch (error) {
        next(error);
    }
});
router.get('/:licensePlate', auth_1.authenticate, async (req, res, next) => {
    try {
        const vehicle = await vehicleRepository.findOne({
            where: { licensePlate: req.params.licensePlate }
        });
        if (!vehicle) {
            throw new errorHandler_1.AppError(404, 'Vehicle not found');
        }
        res.json(vehicle);
    }
    catch (error) {
        next(error);
    }
});
router.post('/', auth_1.authenticate, async (req, res, next) => {
    try {
        const { licensePlate, vehicleType, imageUrl } = req.body;
        const existingVehicle = await vehicleRepository.findOne({
            where: { licensePlate }
        });
        if (existingVehicle) {
            throw new errorHandler_1.AppError(400, 'Vehicle already registered');
        }
        const vehicle = vehicleRepository.create({
            licensePlate,
            vehicleType,
            imageUrl
        });
        await vehicleRepository.save(vehicle);
        res.status(201).json(vehicle);
    }
    catch (error) {
        next(error);
    }
});
router.patch('/:licensePlate/status', auth_1.authenticate, async (req, res, next) => {
    try {
        const { isParked } = req.body;
        const vehicle = await vehicleRepository.findOne({
            where: { licensePlate: req.params.licensePlate }
        });
        if (!vehicle) {
            throw new errorHandler_1.AppError(404, 'Vehicle not found');
        }
        vehicle.isParked = isParked;
        await vehicleRepository.save(vehicle);
        res.json(vehicle);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=vehicle.js.map