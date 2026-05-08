require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const connectDB = require('./config/database');
const config = require('./config/config');
const quizRoutes = require('./routes/quizRoutes');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Quiz Service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use('/api/quiz', quizRoutes);

app.use(errorHandler);

const start = async () => {
  await connectDB();

  app.listen(config.PORT, () => {
    logger.info(`Quiz Service is running on http://localhost:${config.PORT}`);
  });
};

start();

module.exports = app;
