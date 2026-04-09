/**
 * User model — stores all platform users across four roles.
 * Referenced by: Project (userId), SavedResource (userId),
 *                Feedback (userId), ChatSession (userId), Resource (addedBy),
 *                Enrollment (userId), Course (faculty, tas), OTP (userId)
 *
 * Beta changes: added googleId, isVerified, isActive fields;
 * password is no longer required (null for Google-only users
 * until they set one via /set-password); role enum expanded to
 * include instructor and ta; added isDepartmentHead flag for
 * instructors who also manage a department; added department ref.
 */
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName:          { type: String, required: true },
  email:             { type: String, required: true, unique: true },
  // Nullable: Google OAuth users start with no password until /set-password
  password:          { type: String, default: null },
  // Set when user signs in via Google OAuth
  googleId:          { type: String, sparse: true },
  role:              { type: String, enum: ['student', 'instructor', 'ta', 'admin'], default: 'student' },
  skillLevel:        { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
  // True only for instructors who also head a department — not a separate role
  isDepartmentHead:  { type: Boolean, default: false },
  // Department this instructor/TA belongs to (optional for students)
  department:        { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  // Email/password users must verify before they can log in
  isVerified:        { type: Boolean, default: false },
  // Admins can deactivate accounts without deleting them
  isActive:          { type: Boolean, default: true },
  createdAt:         { type: Date, default: Date.now },
  lastLogin:         { type: Date },
});

module.exports = mongoose.model('User', userSchema);
