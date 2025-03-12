"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const ormconfig_1 = require("../config/ormconfig");
const entities_1 = require("../entities");
const bcrypt = __importStar(require("bcryptjs"));
async function createDefaultAdmin() {
    try {
        await ormconfig_1.AppDataSource.initialize();
        const userRepository = ormconfig_1.AppDataSource.getRepository(entities_1.User);
        const existingAdmin = await userRepository.findOne({
            where: { username: 'admin' }
        });
        if (existingAdmin) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            existingAdmin.setHashedPassword(hashedPassword);
            await userRepository.save(existingAdmin);
            console.log('Admin password updated successfully');
            return;
        }
        const adminUser = new entities_1.User();
        adminUser.name = 'Administrator';
        adminUser.username = 'admin';
        adminUser.role = 'admin';
        adminUser.isActive = true;
        const hashedPassword = await bcrypt.hash('admin123', 10);
        adminUser.setHashedPassword(hashedPassword);
        await userRepository.save(adminUser);
        console.log('Default admin user created successfully');
    }
    catch (error) {
        console.error('Error creating admin user:', error);
    }
    finally {
        if (ormconfig_1.AppDataSource.isInitialized) {
            await ormconfig_1.AppDataSource.destroy();
        }
    }
}
createDefaultAdmin();
//# sourceMappingURL=CreateDefaultAdmin.js.map