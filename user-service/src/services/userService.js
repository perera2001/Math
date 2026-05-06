const User = require('../models/User');

/**
 * Create a new Year Coordinator (ADMIN) – called by SUPER_ADMIN only.
 */
const createAdmin = async (name, email, password) => {
  const existing = await User.findOne({ email });
  if (existing) {
    const err = new Error('An account with this email already exists');
    err.statusCode = 409;
    throw err;
  }

  const admin = await User.create({ name, email, password, role: 'ADMIN' });
  return admin;
};

/**
 * Get all users (all roles) – SUPER_ADMIN only.
 */
const getAllUsers = async () =>
  User.find({}).select('-password').sort({ createdAt: -1 });

/**
 * Get students only (role = USER) – ADMIN + SUPER_ADMIN.
 */
const getStudents = async () =>
  User.find({ role: 'USER' }).select('-password').sort({ createdAt: -1 });

/**
 * Get a single user by MongoDB _id.
 */
const getUserById = async (id) => {
  const user = await User.findById(id).select('-password');
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  return user;
};

module.exports = { createAdmin, getAllUsers, getStudents, getUserById };
