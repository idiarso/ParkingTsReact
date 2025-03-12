"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupDatabase = exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const ParkingSession_1 = require("../entities/ParkingSession");
const ParkingRate_1 = require("../entities/ParkingRate");
const User_1 = require("../entities/User");
const logger_1 = require("../utils/logger");
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'parking_system',
    synchronize: process.env.NODE_ENV !== 'production',
    logging: true,
    ssl: false,
    extra: {
        max: 25,
        connectionTimeoutMillis: 10000,
        options: `--client_encoding=UTF8`
    },
    entities: [User_1.User, ParkingSession_1.ParkingSession, ParkingRate_1.ParkingRate],
    migrations: [],
    subscribers: []
});
const setupDatabase = async () => {
    try {
        logger_1.logger.info('Attempting to connect to database with config:', {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || '5432',
            username: process.env.DB_USERNAME || 'postgres',
            database: process.env.DB_NAME || 'parking_system'
        });
        await exports.AppDataSource.initialize();
        logger_1.logger.info('Database connection initialized');
    }
    catch (error) {
        logger_1.logger.error('Error initializing database:', error);
        throw error;
    }
};
exports.setupDatabase = setupDatabase;
//# sourceMappingURL=database.js.map