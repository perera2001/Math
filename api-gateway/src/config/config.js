require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET,
  USER_SERVICE_URL: process.env.USER_SERVICE_URL || 'http://localhost:5001',
  QUESTION_SERVICE_URL: process.env.QUESTION_SERVICE_URL || 'http://localhost:5003',
  QUIZ_SERVICE_URL: process.env.QUIZ_SERVICE_URL || 'http://localhost:5004',
  NODE_ENV: process.env.NODE_ENV || 'development',
};
