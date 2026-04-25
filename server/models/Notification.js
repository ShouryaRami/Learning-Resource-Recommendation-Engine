/**
 * @desc Notification model
 * Stores notification queue and history.
 * Used for enrollment approvals, project approvals,
 * and new course material alerts sent via email.
 */
const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'enrollment_approved',
      'enrollment_rejected',
      'project_approved',
      'project_rejected',
      'new_material',
      'grade_received'
    ],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  emailSent: { type: Boolean, default: false },
  relatedId: { type: mongoose.Schema.Types.ObjectId },
  relatedModel: { type: String },
  createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Notification', notificationSchema)
