/**
 * Enrollment Model
 * Tracks student enrollment requests and approvals.
 * A student can only have one enrollment per course
 * enforced by the unique compound index.
 * Related to: User (student), Course, User (approver)
 */
const mongoose = require('mongoose')

const enrollmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'dropped'],
    default: 'pending'
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  grade: {
    type: String
  }
})

// Prevent duplicate enrollments for same student and course
enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true })

module.exports = mongoose.model('Enrollment', enrollmentSchema)
