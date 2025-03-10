"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupDatabase = exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const logger_1 = require("../utils/logger");
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'parking_system',
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV !== 'production',
    entities: ['dist/entities/**/*.js'],
    migrations: ['dist/migrations/**/*.js'],
    subscribers: ['dist/subscribers/**/*.js'],
});
const setupDatabase = async () => {
    try {
        await exports.AppDataSource.initialize();
        logger_1.logger.info('Database connection established');
    }
    catch (error) {
        logger_1.logger.error('Error connecting to database:', error);
        throw error;
    }
};
exports.setupDatabase = setupDatabase;
//# sourceMappingURL=database.js.map