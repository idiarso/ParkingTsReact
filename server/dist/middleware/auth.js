"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errorHandler_1 = require("./errorHandler");
const tokenBlacklist_1 = require("../utils/tokenBlacklist");
const authenticate = async (req, _res, next) => {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token) {
            throw new errorHandler_1.AppError(401, 'Authentication required');
        }
        if (tokenBlacklist_1.tokenBlacklist.isBlacklisted(token)) {
            throw new errorHandler_1.AppError(401, 'Token has been invalidated');
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'default_secret');
        req.token = token;
        req.user = {
            id: decoded.userId,
            role: decoded.role
        };
        next();
    }
    catch (error) {
        next(new errorHandler_1.AppError(401, 'Invalid or expired token'));
    }
};
exports.authenticate = authenticate;
const authorize = (roles) => {
    return (req, _res, next) => {
        if (!req.user) {
            return next(new errorHandler_1.AppError(401, 'Authentication required'));
        }
        if (!roles.includes(req.user.role)) {
            return next(new errorHandler_1.AppError(403, 'Insufficient permissions'));
        }
        next();
    };
};
exports.authorize = authorize;
//# sourceMappingURL=auth.js.map