/**
 * @desc Submission model
 * Stores student project deliverable submissions.
 * Instructors and TAs with canGradeStudents permission
 * can view submissions and record a grade with feedback.
 */
const mongoose = require('mongoose')

const submissionSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  title: { type: String, required: true, trim: true },
  description: { type: String },
  deliverableUrl: { type: String },
  fileId: { type: mongoose.Schema.Types.ObjectId },
  fileName: { type: String },
  grade: { type: String },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  feedback: { type: String },
  gradedAt: { type: Date },
  submittedAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['submitted', 'graded', 'returned'],
    default: 'submitted'
  }
})

module.exports = mongoose.model('Submission', submissionSchema)
