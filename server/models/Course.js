/**
 * Course Model
 * Represents an academic course within a department.
 * Has assigned faculty instructors and teaching assistants.
 * Students enroll via the Enrollment collection.
 * Related to: Department (many to one),
 * User (faculty and tas arrays),
 * Enrollment (one to many),
 * Project (one to many)
 */
const mongoose = require('mongoose')

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Course code is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required']
  },
  semester: {
    type: String,
    trim: true
  },
  faculty: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  tas: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  enrollmentOpen: {
    type: Boolean,
    default: true
  },
  maxStudents: {
    type: Number,
    default: 30
  },
  domains: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
})

// Index for fast department-based course lookups
courseSchema.index({ department: 1, isActive: 1 })

module.exports = mongoose.model('Course', courseSchema)
