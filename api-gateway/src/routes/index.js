const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { verifyToken } = require('../middleware/authMiddleware');
const { roleMiddleware } = require('../middleware/roleMiddleware');
const config = require('../config/config');
const logger = require('../utils/logger');

const router = express.Router();

const buildProxy = (targetUrl, serviceName) =>
  createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    onProxyReq(proxyReq, req) {
      if (req.user) {
        proxyReq.setHeader('x-user-id', req.user.id || '');
        proxyReq.setHeader('x-user-email', req.user.email || '');
        proxyReq.setHeader('x-user-role', req.user.role || '');
        proxyReq.setHeader('x-user-name', req.user.name || '');
      }

      if (req.body && Object.keys(req.body).length > 0) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
    onError(err, req, res) {
      logger.error(`Proxy error for ${req.method} ${req.path}: ${err.message}`);
      res.status(502).json({ message: `${serviceName} is currently unavailable. Please try again later.` });
    },
  });

const userServiceProxy = buildProxy(config.USER_SERVICE_URL, 'User service');
const questionServiceProxy = buildProxy(config.QUESTION_SERVICE_URL, 'Question service');

// ─── Public Routes (no auth) ────────────────────────────────────────────────
router.use('/auth/register', userServiceProxy);
router.use('/auth/login', userServiceProxy);

// ─── Protected Routes ────────────────────────────────────────────────────────
// Any authenticated user can access their own profile
router.use('/users/profile', verifyToken, userServiceProxy);

// ADMIN + SUPER_ADMIN: view students
router.use('/users/students', verifyToken, roleMiddleware('ADMIN', 'SUPER_ADMIN'), userServiceProxy);

// SUPER_ADMIN only
router.use('/users/all', verifyToken, roleMiddleware('SUPER_ADMIN'), userServiceProxy);
router.use('/users/create-admin', verifyToken, roleMiddleware('SUPER_ADMIN'), userServiceProxy);

// ─── Question Service Routes (ADMIN + SUPER_ADMIN only) ─────────────────────
router.use('/questions', verifyToken, roleMiddleware('ADMIN', 'SUPER_ADMIN'), questionServiceProxy);

// Catch-all protected proxy (future services)
router.use('/', verifyToken, userServiceProxy);

module.exports = router;
