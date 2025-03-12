import { AppDataSource } from '../config/database';
import { User } from '../entities';
import * as bcrypt from 'bcryptjs';

async function createDefaultAdmin() {
    try {
        // Initialize the database connection
        await AppDataSource.initialize();

        const userRepository = AppDataSource.getRepository(User);

        // Check if admin already exists
        const existingAdmin = await userRepository.findOne({
            where: { username: 'admin' }
        });

        if (existingAdmin) {
            // Update the admin's password if it exists
            const hashedPassword = await bcrypt.hash('admin123', 10);
            existingAdmin.setHashedPassword(hashedPassword);
            await userRepository.save(existingAdmin);
            console.log('Admin password updated successfully');
            return;
        }

        // Create new admin user
        const adminUser = new User();
        adminUser.name = 'Administrator';
        adminUser.username = 'admin';
        adminUser.role = 'admin';
        adminUser.isActive = true;

        // Set the hashed password
        const hashedPassword = await bcrypt.hash('admin123', 10);
        adminUser.setHashedPassword(hashedPassword);

        await userRepository.save(adminUser);
        console.log('Default admin user created successfully');

    } catch (error) {
        console.error('Error creating admin user:', error);
    } finally {
        // Close the database connection
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
    }
}

// Run the seed
createDefaultAdmin(); 