const express = require('express');
const {
  getProfile,
  updateProfileController,
  getAllUsersController,
  getStudentsController,
  createAdminController,
  deleteUserController,
  deleteOwnProfileController,
} = require('../controllers/userController');

const router = express.Router();

// GET /api/users/profile  –  Any authenticated user
router.get('/profile', getProfile);

// PUT /api/users/profile  –  Any authenticated user (own profile only)
router.put('/profile', updateProfileController);

// DELETE /api/users/profile  –  Any authenticated user (own account)
router.delete('/profile', deleteOwnProfileController);

// GET /api/users/students  –  ADMIN + SUPER_ADMIN (role check in gateway)
router.get('/students', getStudentsController);

// GET /api/users/all  –  SUPER_ADMIN only (role check in gateway)
router.get('/all', getAllUsersController);

// POST /api/users/create-admin  –  SUPER_ADMIN only (role check in gateway)
router.post('/create-admin', createAdminController);

// DELETE /api/users/:id  –  SUPER_ADMIN only (role check in gateway)
router.delete('/:id', deleteUserController);

module.exports = router;
