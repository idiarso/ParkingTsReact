import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger';

async function resetAdminPassword() {
    try {
        // Initialize the database connection
        await AppDataSource.initialize();
        logger.info('Database connection initialized');

        const userRepository = AppDataSource.getRepository(User);

        // Find admin user
        const admin = await userRepository.findOne({
            where: { username: 'admin' }
        });

        if (!admin) {
            logger.error('Admin user not found');
            return;
        }

        // Generate new password hash
        const hashedPassword = await bcrypt.hash('admin123', 10);

        // Update password directly in the database
        await userRepository
            .createQueryBuilder()
            .update(User)
            .set({ password: hashedPassword })
            .where('id = :id', { id: admin.id })
            .execute();

        logger.info('Admin password reset successfully');

    } catch (error) {
        logger.error('Error resetting admin password:', error);
    } finally {
        // Close the database connection
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
    }
}

// Run the script
resetAdminPassword(); 