"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRoutes = void 0;
const vehicle_1 = __importDefault(require("./vehicle"));
const parking_1 = __importDefault(require("./parking"));
const setupRoutes = (app) => {
    app.use('/api/vehicles', vehicle_1.default);
    app.use('/api/parking', parking_1.default);
};
exports.setupRoutes = setupRoutes;
//# sourceMappingURL=index.js.map