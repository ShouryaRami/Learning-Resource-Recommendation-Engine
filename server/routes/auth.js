/**
 * Auth routes — handles user registration, login, and current user lookup.
 * POST /api/auth/register
 * POST /api/auth/login
 * GET  /api/auth/me  (protected)
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

const signToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

/**
 * @route POST /api/auth/register
 * @desc Register a new user account
 * @access Public
 */
router.post('/register', async (req, res) => {
  const { fullName, email, password, skillLevel } = req.body;

  if (!fullName || !email || !password || !skillLevel) {
    return res.status(400).json({ message: 'fullName, email, password, and skillLevel are required' });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ message: 'Email already registered' });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ fullName, email, password: hashed, skillLevel });

  const token = signToken(user);

  return res.status(201).json({
    token,
    user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role, skillLevel: user.skillLevel },
  });
});

/**
 * @route POST /api/auth/login
 * @desc Authenticate user and return JWT token
 * @access Public
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  user.lastLogin = Date.now();
  await user.save();

  const token = signToken(user);

  return res.status(200).json({
    token,
    user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role, skillLevel: user.skillLevel },
  });
});

/**
 * @route GET /api/auth/me
 * @desc Get current logged in user data
 * @access Private
 */
router.get('/me', protect, async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  return res.status(200).json(user);
});

module.exports = router;
