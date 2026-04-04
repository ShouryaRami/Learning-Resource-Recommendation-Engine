/**
 * Auth routes — registration, login, OTP verification,
 * password reset, Google OAuth, and set-password.
 *
 * POST /api/auth/register
 * POST /api/auth/verify-otp
 * POST /api/auth/resend-otp
 * POST /api/auth/login
 * POST /api/auth/forgot-password
 * POST /api/auth/reset-password
 * POST /api/auth/set-password  (protected)
 * GET  /api/auth/google
 * GET  /api/auth/google/callback
 * GET  /api/auth/me            (protected)
 */
const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const passport = require('passport')
const User = require('../models/User')
const OTP = require('../models/OTP')
const { protect } = require('../middleware/auth')
const { generateOTP } = require('../utils/otpGenerator')
const { sendMail } = require('../config/mailer')
const { verificationEmailTemplate, resetEmailTemplate } = require('../utils/emailTemplates')
const { registerRules, loginRules, handleValidation } = require('../middleware/validate')

const router = express.Router()

/**
 * @desc Sign a JWT for a given user document
 * @param {Object} user - Mongoose User document
 * @returns {string} Signed JWT token
 */
const signToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  )

// ---------------------------------------------------------------------------
// REGISTRATION AND EMAIL VERIFICATION
// ---------------------------------------------------------------------------

/**
 * @route POST /api/auth/register
 * @desc  Register new user and send OTP verification email
 * @access Public
 */
router.post('/register', [...registerRules, handleValidation], async (req, res) => {
  try {
    const { fullName, email, password, skillLevel } = req.body

    // Reject duplicate emails before doing any hashing
    const existing = await User.findOne({ email })
    if (existing) {
      return res.status(400).json({ message: 'An account with this email already exists' })
    }

    // Hash with rounds 12 (upgraded from Alpha's 10)
    const hashedPassword = await bcrypt.hash(password, 12)

    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
      skillLevel,
      isVerified: false
    })

    // Clear any stale OTPs for this user before creating a fresh one
    await OTP.deleteMany({ userId: newUser._id, type: 'email-verify' })

    const otpCode = generateOTP()
    await OTP.create({
      userId: newUser._id,
      code: otpCode,
      type: 'email-verify',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    })

    await sendMail(
      email,
      'Verify your UMBC Learn account',
      verificationEmailTemplate(fullName, otpCode)
    )

    return res.status(200).json({
      message: 'OTP sent to your email. Please verify to continue.',
      email
    })
  } catch (err) {
    console.error('Register error:', err)
    return res.status(500).json({ message: 'Server error during registration' })
  }
})

/**
 * @route POST /api/auth/verify-otp
 * @desc  Verify email OTP and activate account, returns JWT
 * @access Public
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, code } = req.body

    if (!email || !code) {
      return res.status(400).json({ message: 'Email and code are required' })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Find a valid, unused, non-expired OTP for this user
    const otp = await OTP.findOne({
      userId: user._id,
      type: 'email-verify',
      used: false,
      expiresAt: { $gt: new Date() }
    })

    if (!otp) {
      return res.status(400).json({ message: 'Invalid or expired verification code' })
    }

    if (otp.code !== code) {
      return res.status(400).json({ message: 'Incorrect verification code' })
    }

    // Mark OTP consumed so it cannot be reused
    otp.used = true
    await otp.save()

    user.isVerified = true
    await user.save()

    const token = signToken(user)

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        skillLevel: user.skillLevel
      }
    })
  } catch (err) {
    console.error('Verify OTP error:', err)
    return res.status(500).json({ message: 'Server error during verification' })
  }
})

/**
 * @route POST /api/auth/resend-otp
 * @desc  Resend verification OTP — always returns 200 to prevent enumeration
 * @access Public
 */
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body

    const user = await User.findOne({ email })

    // Silently do nothing if user not found or already verified
    if (user && !user.isVerified) {
      await OTP.deleteMany({ userId: user._id, type: 'email-verify' })

      const otpCode = generateOTP()
      await OTP.create({
        userId: user._id,
        code: otpCode,
        type: 'email-verify',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      })

      await sendMail(
        email,
        'Verify your UMBC Learn account',
        verificationEmailTemplate(user.fullName, otpCode)
      )
    }

    return res.status(200).json({ message: 'If that email exists a new OTP was sent' })
  } catch (err) {
    console.error('Resend OTP error:', err)
    return res.status(500).json({ message: 'Server error' })
  }
})

// ---------------------------------------------------------------------------
// LOGIN
// ---------------------------------------------------------------------------

/**
 * @route POST /api/auth/login
 * @desc  Authenticate user with email and password, return JWT
 * @access Public
 */
router.post('/login', [...loginRules, handleValidation], async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    // Unverified users must verify their email before logging in
    // Check this before password so they see the right error message
    if (!user.isVerified) {
      return res.status(403).json({
        message: 'Please verify your email before logging in',
        needsVerification: true,
        email: user.email
      })
    }

    // Google-only users (null password) cannot use email/password login
    if (!user.password) {
      return res.status(400).json({
        message: 'This account uses Google sign-in. Please continue with Google.'
      })
    }

    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    user.lastLogin = Date.now()
    await user.save()

    const token = signToken(user)

    return res.status(200).json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        skillLevel: user.skillLevel
      }
    })
  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({ message: 'Server error during login' })
  }
})

// ---------------------------------------------------------------------------
// PASSWORD RESET
// ---------------------------------------------------------------------------

/**
 * @route POST /api/auth/forgot-password
 * @desc  Send password reset OTP — always 200 to prevent enumeration
 * @access Public
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body

    const user = await User.findOne({ email })

    if (user) {
      // Remove any existing reset OTPs before issuing a new one
      await OTP.deleteMany({ userId: user._id, type: 'password-reset' })

      const otpCode = generateOTP()
      await OTP.create({
        userId: user._id,
        code: otpCode,
        type: 'password-reset',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      })

      await sendMail(
        email,
        'Reset your UMBC Learn password',
        resetEmailTemplate(user.fullName, otpCode)
      )
    }

    return res.status(200).json({ message: 'If that email exists a reset code was sent' })
  } catch (err) {
    console.error('Forgot password error:', err)
    return res.status(500).json({ message: 'Server error' })
  }
})

/**
 * @route POST /api/auth/reset-password
 * @desc  Reset password using OTP code
 * @access Public
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword, confirmPassword } = req.body

    if (!email || !code || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' })
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' })
    }

    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({ message: 'Password must contain at least one uppercase letter' })
    }

    if (!/[0-9]/.test(newPassword)) {
      return res.status(400).json({ message: 'Password must contain at least one number' })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const otp = await OTP.findOne({
      userId: user._id,
      type: 'password-reset',
      used: false,
      expiresAt: { $gt: new Date() }
    })

    if (!otp) {
      return res.status(400).json({ message: 'Invalid or expired reset code' })
    }

    if (otp.code !== code) {
      return res.status(400).json({ message: 'Incorrect reset code' })
    }

    otp.used = true
    await otp.save()

    user.password = await bcrypt.hash(newPassword, 12)
    await user.save()

    return res.status(200).json({ message: 'Password reset successfully' })
  } catch (err) {
    console.error('Reset password error:', err)
    return res.status(500).json({ message: 'Server error during password reset' })
  }
})

/**
 * @route POST /api/auth/set-password
 * @desc  Set password for Google OAuth users who have not set one yet
 * @access Private
 */
router.post('/set-password', protect, async (req, res) => {
  try {
    const { password, confirmPassword } = req.body

    if (!password || !confirmPassword) {
      return res.status(400).json({ message: 'Password and confirm password are required' })
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' })
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' })
    }

    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ message: 'Password must contain at least one uppercase letter' })
    }

    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ message: 'Password must contain at least one number' })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    await User.findByIdAndUpdate(req.user.id, { password: hashedPassword })

    return res.status(200).json({ message: 'Password set successfully' })
  } catch (err) {
    console.error('Set password error:', err)
    return res.status(500).json({ message: 'Server error during set-password' })
  }
})

// ---------------------------------------------------------------------------
// GOOGLE OAUTH
// ---------------------------------------------------------------------------

/**
 * @route GET /api/auth/google
 * @desc  Initiate Google OAuth 2.0 flow
 * @access Public
 */
router.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    // Random state prevents CSRF on the OAuth callback
    state: crypto.randomBytes(16).toString('hex')
  })
)

/**
 * @route GET /api/auth/google/callback
 * @desc  Handle Google OAuth callback, redirect with JWT
 * @access Public
 */
router.get('/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect:
      (process.env.FRONTEND_URL || 'http://localhost:5173') + '/login?error=oauth_failed'
  }),
  (req, res) => {
    const token = signToken(req.user)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'

    // New Google users have no password yet — force them to set one
    if (!req.user.password) {
      return res.redirect(`${frontendUrl}/set-password?token=${token}`)
    }

    return res.redirect(`${frontendUrl}/dashboard?token=${token}`)
  }
)

// ---------------------------------------------------------------------------
// CURRENT USER
// ---------------------------------------------------------------------------

/**
 * @route GET /api/auth/me
 * @desc  Get current logged-in user data
 * @access Private
 */
router.get('/me', protect, async (req, res) => {
  const user = await User.findById(req.user.id).select('-password')
  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }
  return res.status(200).json(user)
})

module.exports = router
