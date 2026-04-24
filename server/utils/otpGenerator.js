/**
 * @desc OTP generation utility for UMBC Learn
 */
const crypto = require('crypto')

/**
 * @desc Generates a cryptographically random 6-digit OTP
 * Uses crypto module for better randomness than Math.random
 * @returns {string} 6-digit numeric string e.g. "847291"
 */
function generateOTP() {
  // Generate random number between 100000 and 999999
  const otp = crypto.randomInt(100000, 999999)
  return String(otp)
}

module.exports = { generateOTP }
