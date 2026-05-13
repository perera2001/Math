const User = require('../models/User');

const VALID_GRADES = ['GRADE_9', 'GRADE_10', 'GRADE_11'];

/**
 * Create a new Year Coordinator (ADMIN) – called by SUPER_ADMIN only.
 */
const createAdmin = async (name, email, password, grade) => {
  if (!VALID_GRADES.includes(grade)) {
    const err = new Error('Grade must be GRADE_9, GRADE_10, or GRADE_11');
    err.statusCode = 400;
    throw err;
  }

  const existing = await User.findOne({ email });
  if (existing) {
    const err = new Error('An account with this email already exists');
    err.statusCode = 409;
    throw err;
  }

  const admin = await User.create({ name, email, password, role: 'ADMIN', grade });
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

/**
 * Delete a user by _id. SUPER_ADMIN cannot be deleted.
 */
const deleteUser = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  if (user.role === 'SUPER_ADMIN') {
    const err = new Error('Super admin account cannot be deleted');
    err.statusCode = 403;
    throw err;
  }
  await User.findByIdAndDelete(id);
};

/**
 * Update own profile (name, email, password). Grade is NOT changeable.
 */
const updateProfile = async (id, updates) => {
  const user = await User.findById(id).select('+password');
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  if (updates.name)  user.name  = updates.name.trim();
  if (updates.email) user.email = updates.email.toLowerCase().trim();
  if (updates.password) {
    if (updates.password.length < 6) {
      const err = new Error('Password must be at least 6 characters');
      err.statusCode = 400;
      throw err;
    }
    user.password = updates.password; // pre-save hook hashes it
  }

  await user.save();
  // Return without password
  return User.findById(id).select('-password');
};

module.exports = { createAdmin, getAllUsers, getStudents, getUserById, deleteUser, updateProfile };
