const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');

const generateToken = (payload) =>
  jwt.sign(payload, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });

/**
 * Register a new student (role = USER).
 */
const registerStudent = async (name, email, password) => {
  const existing = await User.findOne({ email });
  if (existing) {
    const err = new Error('An account with this email already exists');
    err.statusCode = 409;
    throw err;
  }

  const user = await User.create({ name, email, password, role: 'USER' });

  const token = generateToken({
    id: user._id,
    email: user.email,
    role: user.role,
    name: user.name,
  });

  return { user, token };
};

/**
 * Authenticate any user (SUPER_ADMIN, ADMIN, or USER).
 */
const loginUser = async (email, password) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const token = generateToken({
    id: user._id,
    email: user.email,
    role: user.role,
    name: user.name,
    grade: user.grade || null,
  });

  return { user, token };
};

module.exports = { registerStudent, loginUser };
