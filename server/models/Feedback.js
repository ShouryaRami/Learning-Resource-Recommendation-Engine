/**
 * Feedback model — stores a student's star rating and optional comment on a resource.
 * Belongs to: User (userId)
 * References: Resource (resourceId), Project (projectId — optional context)
 */
const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  resourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true },
  projectId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  rating:     { type: Number, min: 1, max: 5, required: true },
  comment:    { type: String },
  helpful:    { type: Boolean },
  createdAt:  { type: Date, default: Date.now },
});

module.exports = mongoose.model('Feedback', feedbackSchema);
