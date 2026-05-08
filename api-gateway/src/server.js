require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const config = require('./config/config');
const routes = require('./routes');
const logger = require('./utils/logger');

const app = express();

// ─── Global Middleware ───────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json());

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'API Gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use('/api', routes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found.` });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(config.PORT, () => {
  logger.info(`API Gateway is running on http://localhost:${config.PORT}`);
  logger.info(`Proxying /api/users/* → ${config.USER_SERVICE_URL}`);
  logger.info(`Proxying /api/questions/* → ${config.QUESTION_SERVICE_URL}`);
});

module.exports = app;
