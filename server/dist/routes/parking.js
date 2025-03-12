"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const entities_1 = require("../entities");
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const typeorm_1 = require("typeorm");
const ParkingController_1 = require("../controllers/ParkingController");
const router = (0, express_1.Router)();
const parkingRepository = database_1.AppDataSource.getRepository(entities_1.ParkingSession);
const parkingController = new ParkingController_1.ParkingController();
router.post('/entry', auth_1.authenticate, parkingController.recordEntry.bind(parkingController));
router.post('/exit', auth_1.authenticate, parkingController.processExit.bind(parkingController));
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
router.get('/recent-entries', auth_1.authenticate, parkingController.getRecentSessions.bind(parkingController));
router.get('/details/:plateNumber', auth_1.authenticate, parkingController.getSessionDetails.bind(parkingController));
router.get('/statistics', auth_1.authenticate, parkingController.getStatistics.bind(parkingController));
router.get('/sessions', auth_1.authenticate, parkingController.getRecentSessions.bind(parkingController));
exports.default = router;
//# sourceMappingURL=parking.js.map