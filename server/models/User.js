/**
 * User model — stores registered students and admins.
 * Referenced by: Project (userId), SavedResource (userId),
 *                Feedback (userId), ChatSession (userId), Resource (addedBy)
 */
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName:   { type: String, required: true },
  email:      { type: String, required: true, unique: true },
  password:   { type: String, required: true },
  role:       { type: String, enum: ['student', 'admin'], default: 'student' },
  skillLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
  createdAt:  { type: Date, default: Date.now },
  lastLogin:  { type: Date },
});

module.exports = mongoose.model('User', userSchema);
