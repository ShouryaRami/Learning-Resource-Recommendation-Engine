/**
 * SavedResource model — tracks resources a student has bookmarked.
 * Belongs to: User (userId)
 * References: Resource (resourceId), Project (projectId — optional context)
 */
const mongoose = require('mongoose');

const savedResourceSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  resourceId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true },
  projectId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  isCompleted: { type: Boolean, default: false },
  savedAt:     { type: Date, default: Date.now },
  completedAt: { type: Date },
});

module.exports = mongoose.model('SavedResource', savedResourceSchema);
