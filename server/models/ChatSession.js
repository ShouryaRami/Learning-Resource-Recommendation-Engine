/**
 * ChatSession model — stores AI chat history per user per course.
 * Each session holds the full message thread for one user in one course.
 * Messages are stored in order so the frontend can replay them.
 * Related to: User (userId), Course (courseId), Project (projectId optional)
 */
const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
  role:      { type: String, enum: ['user', 'assistant'] },
  content:   { type: String },
  // Stored so the frontend can show timestamps on messages
  timestamp: { type: Date, default: Date.now }
})

const chatSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Chat is scoped to a course so Gemini can use the right materials
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  // Optional: if the student is chatting in the context of a specific project
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  messages:  [messageSchema],
  createdAt: { type: Date, default: Date.now }
})

// Fast lookup: one session per user per course
chatSessionSchema.index({ userId: 1, courseId: 1 })

module.exports = mongoose.model('ChatSession', chatSessionSchema)
