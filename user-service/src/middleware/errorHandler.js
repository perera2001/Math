const config = require('../config/config');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log stack trace in development
  if (config.NODE_ENV === 'development') {
    console.error(`[Error] ${statusCode} – ${message}\n${err.stack}`);
  } else {
    console.error(`[Error] ${statusCode} – ${message}`);
  }

  res.status(statusCode).json({
    message,
    ...(config.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
