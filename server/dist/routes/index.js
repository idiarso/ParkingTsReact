"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("./auth"));
const vehicles_1 = __importDefault(require("./vehicles"));
const sessions_1 = __importDefault(require("./sessions"));
const settings_1 = __importDefault(require("./settings"));
const users_1 = __importDefault(require("./users"));
const parking_1 = __importDefault(require("./parking"));
const receipts_1 = __importDefault(require("./receipts"));
const router = (0, express_1.Router)();
router.use('/auth', auth_1.default);
router.use('/vehicles', vehicles_1.default);
router.use('/sessions', sessions_1.default);
router.use('/settings', settings_1.default);
router.use('/users', users_1.default);
router.use('/parking', parking_1.default);
router.use('/receipts', receipts_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map