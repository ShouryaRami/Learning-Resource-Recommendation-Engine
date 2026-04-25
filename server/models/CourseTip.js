/**
 * @desc CourseTip model
 * Stores instructor and TA written tips and tool
 * recommendations for a course. Text-based entries
 * that do not require file uploads.
 * Tips are searchable and surfaced in student
 * recommendations and RAG chat alongside materials.
 */
const mongoose = require('mongoose')

const courseTipSchema = new mongoose.Schema({
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
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  category: {
    type: String,
    enum: ['study_tip', 'tool_recommendation', 'resource_link', 'general'],
    default: 'general'
  },
  toolUrl: {
    type: String,
    trim: true
  },
  isVisibleToStudents: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('CourseTip', courseTipSchema)
