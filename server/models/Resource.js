/**
 * Resource model — stores all learnable resources (tutorials, docs, videos, etc.).
 * Referenced by: Project (recommendations[]), SavedResource (resourceId),
 *                Feedback (resourceId)
 * Owned by: User (addedBy — the admin who added it)
 */
const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title:          { type: String, required: true },
  url:            { type: String, required: true },
  description:    { type: String },
  domain:         { type: String, enum: ['web', 'mobile', 'ml', 'data', 'security', 'systems', 'devops', 'general'] },
  language:       { type: String, enum: ['javascript', 'python', 'java', 'cpp', 'typescript', 'go', 'any'] },
  skillLevel:     { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
  resourceType:   { type: String, enum: ['tutorial', 'documentation', 'github', 'video', 'article', 'book', 'library'] },
  estimatedHours: { type: Number },
  youtubeUrl:     { type: String },
  tags:           [{ type: String }],
  baseScore:      { type: Number, default: 50 },
  averageRating:  { type: Number, default: 0 },
  totalRatings:   { type: Number, default: 0 },
  usageCount:     { type: Number, default: 0 },
  addedBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt:      { type: Date, default: Date.now },
  isActive:       { type: Boolean, default: true },
});

module.exports = mongoose.model('Resource', resourceSchema);
