"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.AppError = void 0;
const logger_1 = require("../utils/logger");
class AppError extends Error {
    constructor(statusCode, message, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.isOperational = isOperational;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
exports.AppError = AppError;
const errorHandler = (error, _req, res, _next) => {
    if (error instanceof AppError) {
        logger_1.logger.error(`[${error.statusCode}] ${error.message}`);
        return res.status(error.statusCode).json({
            status: 'error',
            message: error.message,
        });
    }
    logger_1.logger.error('Unexpected error:', error);
    return res.status(500).json({
        status: 'error',
        message: 'Internal server error',
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map