const User = require('../models/User');
const config = require('../config/config');
const logger = require('../utils/logger');

/**
 * Seeds the SUPER_ADMIN account on first boot.
 * Credentials come from environment variables.
 */
const seedSuperAdmin = async () => {
  try {
    const existing = await User.findOne({ role: 'SUPER_ADMIN' });

    if (existing) {
      logger.info('Super admin account already exists – skipping seed');
      return;
    }

    await User.create({
      name: config.SUPER_ADMIN.name,
      email: config.SUPER_ADMIN.email,
      password: config.SUPER_ADMIN.password,
      role: 'SUPER_ADMIN',
    });

    logger.info(`Super admin seeded → email: ${config.SUPER_ADMIN.email}`);
  } catch (error) {
    logger.error(`Failed to seed super admin: ${error.message}`);
  }
};

module.exports = seedSuperAdmin;
