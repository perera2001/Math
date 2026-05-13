const express = require('express');
const { register, login } = require('../controllers/authController');

const router = express.Router();

// POST /api/auth/register  –  Student self-registration
router.post('/register', register);

// POST /api/auth/login  –  All roles
router.post('/login', login);

module.exports = router;
