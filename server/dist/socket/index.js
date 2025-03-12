"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocketHandlers = void 0;
const logger_1 = require("../utils/logger");
const setupSocketHandlers = (io) => {
    const connectedClients = new Map();
    io.on('connection', (socket) => {
        logger_1.logger.info(`Client connected: ${socket.id}`);
        connectedClients.set(socket.id, {});
        socket.on('register:client', (data) => {
            const client = connectedClients.get(socket.id);
            if (client) {
                client.type = data.type;
                logger_1.logger.info(`Client ${socket.id} registered as: ${data.type}`);
            }
        });
        socket.on('gate:status', (data) => {
            io.emit('gate:status:update', data);
            logger_1.logger.info(`Gate ${data.gateId} status: ${data.status}`);
        });
        socket.on('vehicle:entry', (data) => {
            io.emit('vehicle:entry:update', data);
            logger_1.logger.info(`Vehicle entered: ${data.licensePlate}, Type: ${data.vehicleType}`);
        });
        socket.on('vehicle:exit', (data) => {
            io.emit('vehicle:exit:update', data);
            logger_1.logger.info(`Vehicle exited: ${data.licensePlate}, Duration: ${data.duration} minutes, Fee: $${data.fee}`);
        });
        socket.on('parking:update', (data) => {
            io.emit('parking:status:update', data);
            logger_1.logger.info(`Parking status update - Total: ${data.total}, Occupied: ${data.occupied}`);
        });
        socket.on('disconnect', () => {
            logger_1.logger.info(`Client disconnected: ${socket.id}`);
            connectedClients.delete(socket.id);
        });
        socket.on('ping', (callback) => {
            logger_1.logger.debug(`Ping received from ${socket.id}`);
            if (typeof callback === 'function') {
                callback({ time: new Date().toISOString() });
            }
        });
        socket.on('error', (error) => {
            logger_1.logger.error(`Socket error for client ${socket.id}:`, error);
        });
    });
    const getClientCount = () => ({
        total: connectedClients.size,
        admin: Array.from(connectedClients.values()).filter(client => client.type === 'admin').length,
        gateIn: Array.from(connectedClients.values()).filter(client => client.type === 'gate-in').length,
        gateOut: Array.from(connectedClients.values()).filter(client => client.type === 'gate-out').length,
    });
    setInterval(() => {
        const status = getClientCount();
        logger_1.logger.info(`Connected clients: ${JSON.stringify(status)}`);
    }, 60000);
};
exports.setupSocketHandlers = setupSocketHandlers;
//# sourceMappingURL=index.js.map