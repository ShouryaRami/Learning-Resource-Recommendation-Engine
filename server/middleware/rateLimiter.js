/**
 * @desc Rate limiting middleware for UMBC Learn API
 * Prevents brute force attacks on auth endpoints
 * and general API abuse.
 */
const rateLimit = require('express-rate-limit')

/**
 * @desc Global rate limiter applied to all routes
 * Allows 100 requests per 15 minutes per IP address
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
})

/**
 * @desc Strict rate limiter for authentication routes only
 * Allows only 5 requests per 15 minutes per IP address
 * Protects register, login, and OTP endpoints
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Too many auth attempts, please try again in 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false
})

module.exports = { globalLimiter, authLimiter }
