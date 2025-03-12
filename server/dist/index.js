"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const routes_1 = __importDefault(require("./routes"));
const database_1 = require("./config/database");
const socket_1 = require("./socket");
const errorHandler_1 = require("./middleware/errorHandler");
const logger_1 = require("./utils/logger");
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.get('/', (_req, res) => {
    res.json({
        message: 'Welcome to the Parking System API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            vehicles: '/api/vehicles',
            sessions: '/api/sessions',
            settings: '/api/settings',
            users: '/api/users'
        }
    });
});
app.use('/api', routes_1.default);
(0, socket_1.initializeSocket)(httpServer);
app.use(errorHandler_1.errorHandler);
const PORT = process.env.PORT || 5000;
const startServer = async () => {
    try {
        await (0, database_1.setupDatabase)();
        httpServer.listen(PORT, () => {
            logger_1.logger.info(`Server running on port ${PORT}`);
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=index.js.map