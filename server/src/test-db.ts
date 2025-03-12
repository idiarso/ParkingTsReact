import { AppDataSource } from './config/database';
import { User } from './entities/User';

async function testDatabase() {
    try {
        // Initialize the database connection
        await AppDataSource.initialize();
        console.log('Database connected successfully');

        const userRepository = AppDataSource.getRepository(User);

        // Delete existing admin user if exists
        await userRepository.delete({ username: 'admin' });

        // Create new admin user
        const adminUser = new User();
        adminUser.name = 'Administrator';
        adminUser.username = 'admin';
        adminUser.password = 'admin123';
        adminUser.role = 'admin';
        adminUser.isActive = true;

        // The password will be hashed automatically by @BeforeInsert
        await userRepository.save(adminUser);
        console.log('Admin user created successfully');

        // Test login
        const user = await userRepository.findOne({ where: { username: 'admin' } });
        if (user) {
            const isValid = await user.validatePassword('admin123');
            console.log('Password validation:', isValid);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        // Close the connection
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
    }
}

testDatabase(); 