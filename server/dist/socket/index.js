"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocketHandlers = void 0;
const logger_1 = require("../utils/logger");
const setupSocketHandlers = (io) => {
    io.on('connection', (socket) => {
        logger_1.logger.info(`Client connected: ${socket.id}`);
        socket.on('gate:status', (data) => {
            io.emit('gate:status:update', data);
            logger_1.logger.info(`Gate ${data.gateId} status: ${data.status}`);
        });
        socket.on('vehicle:entry', (data) => {
            io.emit('vehicle:entry:update', data);
            logger_1.logger.info(`Vehicle entered: ${data.licensePlate}`);
        });
        socket.on('vehicle:exit', (data) => {
            io.emit('vehicle:exit:update', data);
            logger_1.logger.info(`Vehicle exited: ${data.licensePlate}`);
        });
        socket.on('parking:update', (data) => {
            io.emit('parking:status:update', data);
            logger_1.logger.info(`Parking status update - Total: ${data.total}, Occupied: ${data.occupied}`);
        });
        socket.on('disconnect', () => {
            logger_1.logger.info(`Client disconnected: ${socket.id}`);
        });
    });
};
exports.setupSocketHandlers = setupSocketHandlers;
//# sourceMappingURL=index.js.map