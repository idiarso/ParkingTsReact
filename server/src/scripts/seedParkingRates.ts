import { AppDataSource } from '../config/database';
import { ParkingRate } from '../entities/ParkingRate';
import { logger } from '../utils/logger';

const seedParkingRates = async () => {
  try {
    await AppDataSource.initialize();
    const rateRepository = AppDataSource.getRepository(ParkingRate);

    const defaultRates = [
      {
        vehicleType: 'Motorcycle',
        baseRate: 5.00,
        hourlyRate: 2.50,
        gracePeriodMinutes: 15
      },
      {
        vehicleType: 'Car',
        baseRate: 10.00,
        hourlyRate: 5.00,
        gracePeriodMinutes: 15
      },
      {
        vehicleType: 'SUV',
        baseRate: 15.00,
        hourlyRate: 7.50,
        gracePeriodMinutes: 15
      },
      {
        vehicleType: 'Van',
        baseRate: 15.00,
        hourlyRate: 7.50,
        gracePeriodMinutes: 15
      },
      {
        vehicleType: 'Light Truck',
        baseRate: 20.00,
        hourlyRate: 10.00,
        gracePeriodMinutes: 20
      },
      {
        vehicleType: 'Heavy Truck',
        baseRate: 30.00,
        hourlyRate: 15.00,
        gracePeriodMinutes: 30
      },
      {
        vehicleType: 'Bus',
        baseRate: 25.00,
        hourlyRate: 12.50,
        gracePeriodMinutes: 20
      },
      {
        vehicleType: 'Electric Car',
        baseRate: 8.00,
        hourlyRate: 4.00,
        gracePeriodMinutes: 20
      }
    ];

    for (const rate of defaultRates) {
      const existingRate = await rateRepository.findOne({
        where: {
          vehicleType: rate.vehicleType,
          isActive: true
        }
      });

      if (!existingRate) {
        await rateRepository.save(rateRepository.create(rate));
        logger.info(`Created parking rate for ${rate.vehicleType}`);
      } else {
        // Update existing rates
        existingRate.baseRate = rate.baseRate;
        existingRate.hourlyRate = rate.hourlyRate;
        existingRate.gracePeriodMinutes = rate.gracePeriodMinutes;
        await rateRepository.save(existingRate);
        logger.info(`Updated parking rate for ${rate.vehicleType}`);
      }
    }

    logger.info('Parking rates seeded successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding parking rates:', error);
    process.exit(1);
  }
};

seedParkingRates(); 