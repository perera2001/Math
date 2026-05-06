require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET,
  USER_SERVICE_URL: process.env.USER_SERVICE_URL || 'http://localhost:5001',
  NODE_ENV: process.env.NODE_ENV || 'development',
};
