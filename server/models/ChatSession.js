/**
 * ChatSession model — stores AI chat history between a student and the assistant.
 * Alpha: lightweight logging only. Full implementation in Beta.
 * Belongs to: User (userId)
 * References: Project (projectId — optional, provides recommendation context)
 */
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role:      { type: String, enum: ['user', 'assistant'] },
  content:   { type: String },
  timestamp: { type: Date },
});

const chatSessionSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  messages:  [messageSchema],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ChatSession', chatSessionSchema);
