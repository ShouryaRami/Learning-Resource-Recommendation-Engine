/**
 * OTP Model
 * Stores one-time passwords for email verification
 * and password reset. Each OTP is single-use and
 * expires after 10 minutes.
 * Related to: User (userId foreign key)
 */
const mongoose = require('mongoose')

const otpSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  code: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['email-verify', 'password-reset'],
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  used: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

// Compound index for fast OTP lookups
otpSchema.index({ userId: 1, type: 1, used: 1 })

// TTL index: MongoDB auto-deletes expired OTPs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

module.exports = mongoose.model('OTP', otpSchema)
