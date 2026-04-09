/**
 * CourseMaterial Model
 * Represents an uploaded course material file.
 * Files are stored in MongoDB GridFS (courseMaterials bucket).
 * Extracted text is stored here for RAG-based search.
 * Related to: Course (courseId), User (uploadedBy)
 */
const mongoose = require('mongoose')

const courseMaterialSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    enum: ['pdf', 'docx', 'doc', 'pptx', 'ppt', 'zip', 'txt'],
    required: true
  },
  fileSize: {
    type: Number
    // stored in bytes
  },
  gridfsId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
    // GridFS file ID for downloading the original file
  },
  extractedText: {
    type: String,
    default: ''
    // Text extracted from file for RAG search
    // Limited to 100000 characters
  },
  isProcessed: {
    type: Boolean,
    default: false
    // true once text extraction is complete
  },
  processingError: {
    type: String
    // populated if text extraction failed
  },
  isActive: {
    type: Boolean,
    default: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
})

// Compound index for fast course material lookups
courseMaterialSchema.index({ courseId: 1, isActive: 1 })

module.exports = mongoose.model('CourseMaterial', courseMaterialSchema)
