"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const typeorm_1 = require("typeorm");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const logger_1 = require("../utils/logger");
let User = class User {
    constructor() {
        this.tempPassword = null;
    }
    async hashPassword() {
        if (this.password && this.password !== this.tempPassword) {
            if (!this.password.startsWith('$2a$')) {
                logger_1.logger.debug('Hashing password during save', {
                    originalPassword: this.password.substring(0, 3) + '...',
                    isHashed: this.password.startsWith('$2a$')
                });
                this.password = await bcryptjs_1.default.hash(this.password, 10);
                logger_1.logger.debug('Password hashed', {
                    hashedPassword: this.password.substring(0, 7) + '...'
                });
            }
            this.tempPassword = this.password;
        }
    }
    async validatePassword(password) {
        logger_1.logger.debug('Validating password', {
            providedPassword: password.substring(0, 3) + '...',
            storedHash: this.password.substring(0, 7) + '...'
        });
        const isValid = await bcryptjs_1.default.compare(password, this.password);
        logger_1.logger.debug('Password validation result', { isValid });
        return isValid;
    }
    setHashedPassword(hashedPassword) {
        logger_1.logger.debug('Setting hashed password', {
            hashedPassword: hashedPassword.substring(0, 7) + '...'
        });
        this.password = hashedPassword;
        this.tempPassword = hashedPassword;
    }
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], User.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], User.prototype, "username", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['admin', 'operator', 'cashier'],
        default: 'operator'
    }),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], User.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "lastLogin", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], User.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.BeforeInsert)(),
    (0, typeorm_1.BeforeUpdate)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], User.prototype, "hashPassword", null);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)('users')
], User);
//# sourceMappingURL=User.js.map