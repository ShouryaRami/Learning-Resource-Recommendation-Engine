/**
 * Project model — stores a student's project context used to generate recommendations.
 * Belongs to: User (userId)
 * References: Resource[] (recommendations — cached result of the engine)
 */
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:           { type: String, required: true },
  domain:          { type: String, enum: ['web', 'mobile', 'ml', 'data', 'security', 'systems', 'devops', 'general'] },
  language:        { type: String, enum: ['javascript', 'python', 'java', 'cpp', 'typescript', 'go', 'any'] },
  skillLevel:      { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
  timeline:        { type: String, enum: ['1week', '2weeks', '1month', '3months', 'semester'] },
  description:     { type: String },
  status:          { type: String, enum: ['active', 'completed', 'paused'], default: 'active' },
  recommendations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Resource' }],
  createdAt:       { type: Date, default: Date.now },
  updatedAt:       { type: Date },
});

module.exports = mongoose.model('Project', projectSchema);
