/**
 * @desc ProjectIdea model
 * Stores instructor-created project ideas for the
 * project bank. Students can browse and adopt an idea
 * which pre-fills their project pitch form.
 */
const mongoose = require('mongoose')

const projectIdeaSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  domain: { type: String, required: true },
  language: { type: String, required: true },
  difficultyLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  maxStudents: { type: Number, default: 1 },
  adoptedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('ProjectIdea', projectIdeaSchema)
