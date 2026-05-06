const express = require('express');
const {
  getProfile,
  getAllUsersController,
  getStudentsController,
  createAdminController,
} = require('../controllers/userController');

const router = express.Router();

// GET /api/users/profile  –  Any authenticated user (role check in gateway)
router.get('/profile', getProfile);

// GET /api/users/students  –  ADMIN + SUPER_ADMIN (role check in gateway)
router.get('/students', getStudentsController);

// GET /api/users/all  –  SUPER_ADMIN only (role check in gateway)
router.get('/all', getAllUsersController);

// POST /api/users/create-admin  –  SUPER_ADMIN only (role check in gateway)
router.post('/create-admin', createAdminController);

module.exports = router;
