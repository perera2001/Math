const {
  createAdmin,
  getAllUsers,
  getStudents,
  getUserById,
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
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const admin = await createAdmin(name, email, password);
    return res.status(201).json({ message: 'Admin (Year Coordinator) created successfully', user: admin });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  getAllUsersController,
  getStudentsController,
  createAdminController,
};
