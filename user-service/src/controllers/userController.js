const {
  createAdmin,
  getAllUsers,
  getStudents,
  getUserById,
  deleteUser,
  updateProfile,
} = require('../services/userService');

/**
 * GET /api/users/profile
 * The API Gateway injects x-user-id from the verified JWT.
 */
const getProfile = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized. User context missing.' });
    }

    const user = await getUserById(userId);
    return res.status(200).json({ message: 'Profile retrieved successfully', user });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/all  –  SUPER_ADMIN only (enforced by gateway)
 */
const getAllUsersController = async (req, res, next) => {
  try {
    const users = await getAllUsers();
    return res.status(200).json({ message: 'Users retrieved successfully', users });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/students  –  ADMIN + SUPER_ADMIN (enforced by gateway)
 */
const getStudentsController = async (req, res, next) => {
  try {
    const students = await getStudents();
    return res.status(200).json({ message: 'Students retrieved successfully', students });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users/create-admin  –  SUPER_ADMIN only (enforced by gateway)
 */
const createAdminController = async (req, res, next) => {
  try {
    const { name, email, password, grade } = req.body;

    if (!name || !email || !password || !grade) {
      return res.status(400).json({ message: 'Name, email, password, and grade are required' });
    }

    const admin = await createAdmin(name, email, password, grade);
    return res.status(201).json({ message: 'Admin (Year Coordinator) created successfully', user: admin });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/users/profile  –  Any authenticated user (own profile only)
 */
const updateProfileController = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized. User context missing.' });
    }

    const { name, email, password } = req.body;
    if (!name && !email && !password) {
      return res.status(400).json({ message: 'Provide at least one field to update (name, email, or password)' });
    }

    const user = await updateProfile(userId, { name, email, password });
    return res.status(200).json({ message: 'Profile updated successfully', user });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/users/:id  –  SUPER_ADMIN only (enforced by gateway)
 */
const deleteUserController = async (req, res, next) => {
  try {
    const { id } = req.params;
    await deleteUser(id);
    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/users/profile  –  Any authenticated user (own account)
 */
const deleteOwnProfileController = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized. User context missing.' });
    }
    await deleteUser(userId);
    return res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfileController,
  getAllUsersController,
  getStudentsController,
  createAdminController,
  deleteUserController,
  deleteOwnProfileController,
};
