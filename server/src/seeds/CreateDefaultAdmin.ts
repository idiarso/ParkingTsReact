import { AppDataSource } from '../config/ormconfig';
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
            console.log('Admin user already exists');
            return;
        }

        // Create admin user
        const adminUser = userRepository.create({
            name: 'Administrator',
            username: 'admin',
            password: await bcrypt.hash('admin123', 10),
            role: 'admin',
            isActive: true
        });

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