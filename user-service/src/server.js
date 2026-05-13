require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const connectDB = require('./config/database');
const config = require('./config/config');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const errorHandler = require('./middleware/errorHandler');
const seedSuperAdmin = require('./utils/seedSuperAdmin');
const logger = require('./utils/logger');

const app = express();

// ─── Global Middleware ───────────────────────────────────────────────────────
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'User Service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// ─── Error Handler (must be last middleware) ─────────────────────────────────
app.use(errorHandler);

// ─── Bootstrap ───────────────────────────────────────────────────────────────
const start = async () => {
  await connectDB();
  await seedSuperAdmin();

  app.listen(config.PORT, () => {
    logger.info(`User Service is running on http://localhost:${config.PORT}`);
  });
};

start();

module.exports = app;
