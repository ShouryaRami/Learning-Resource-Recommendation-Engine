/**
 * TAPermission model — stores per-course per-TA granular permissions.
 * Each document represents the permissions one TA has within one course.
 * Instructors and admins manage these permissions via the TA routes.
 *
 * All permission flags default to false so TAs start with no access
 * until explicitly granted by the course instructor or admin.
 */
const mongoose = require('mongoose')

const taPermissionSchema = new mongoose.Schema({
  // The TA user whose permissions are being defined
  taUserId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // The course these permissions apply to
  courseId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  // Who granted/last updated these permissions
  grantedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // --- Permission flags ---
  // Can this TA approve or reject student enrollment requests?
  canApproveEnrollments:  { type: Boolean, default: false },
  // Can this TA view enrolled student details and project reports?
  canViewStudentReports:  { type: Boolean, default: false },
  // Can this TA approve or reject student-submitted course projects?
  canApproveProjects:     { type: Boolean, default: false },
  // Can this TA add resources to the course resource pool?
  canAddResources:        { type: Boolean, default: false },
  // Can this TA record or update student grades in this course?
  canGradeStudents:       { type: Boolean, default: false },

  updatedAt: { type: Date, default: Date.now },
})

// One permission document per TA per course — enforced at DB level
taPermissionSchema.index({ taUserId: 1, courseId: 1 }, { unique: true })

module.exports = mongoose.model('TAPermission', taPermissionSchema)
