/**
 * @desc Chat routes for UMBC Learn.
 * Provides AI-powered chat grounded in course materials.
 * Uses Gemini 2.5 Flash with RAG (Retrieval Augmented Generation):
 * student questions are answered using relevant excerpts from the
 * course's uploaded materials rather than generic internet knowledge.
 */
const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const { chatWithMaterials } = require('../utils/geminiAPI')
const { searchMaterials, searchTips } = require('../utils/materialSearch')
const ChatSession = require('../models/ChatSession')
const Course = require('../models/Course')
const Project = require('../models/Project')

/**
 * @route POST /api/chat
 * @desc  Send a message and receive an AI response grounded
 *   in the uploaded materials for the specified course.
 *   Saves the conversation to ChatSession for history.
 * @access Private
 * @body  { message, courseId, projectId? }
 */
router.post('/', protect, async (req, res) => {
  try {
    const { message, courseId, projectId } = req.body

    if (!message) {
      return res.status(400).json({ message: 'message is required' })
    }
    if (!courseId) {
      return res.status(400).json({ message: 'courseId is required' })
    }

    // Step 1 — Fetch course (needed for AI toggle check and system prompt)
    const course = await Course.findById(courseId).select('title aiProcessingEnabled')

    // Step 2 — If AI processing is disabled, return a non-Gemini response immediately
    if (course && course.aiProcessingEnabled === false) {
      return res.status(200).json({
        reply: 'AI processing is currently disabled for this course by the instructor. Please check the course materials tab for uploaded resources or contact your instructor directly.',
        sources: [],
        aiDisabled: true
      })
    }

    // Step 3 — Retrieve relevant material excerpts (the R in RAG)
    const materialExcerpts = await searchMaterials(message, courseId)

    // Step 4 — Search instructor tips for relevant content
    let tipResults = []
    try {
      tipResults = await searchTips(message, courseId)
    } catch (err) {
      console.error('Tip search error:', err.message)
    }
    // Step 5 — Optionally enrich context with the student's project details
    let projectContext = null
    if (projectId) {
      const project = await Project
        .findById(projectId)
        .select('title domain language')
      if (project) {
        projectContext = {
          title:    project.title,
          domain:   project.domain,
          language: project.language
        }
      }
    }

    // Step 6 — Call Gemini with materials and tips context (the G in RAG)
    const { text: reply, sources } = await chatWithMaterials(
      message,
      course?.title || '',
      materialExcerpts,
      projectContext,
      tipResults
    )

    // Step 7 — Persist to chat session (non-fatal if it fails)
    try {
      const newUserMsg      = { role: 'user',      content: message, timestamp: new Date() }
      const newAssistantMsg = { role: 'assistant', content: reply,   timestamp: new Date() }

      let session = await ChatSession.findOne({ userId: req.user.id, courseId })
      if (session) {
        session.messages.push(newUserMsg, newAssistantMsg)
        await session.save()
      } else {
        await ChatSession.create({
          userId:    req.user.id,
          courseId,
          projectId: projectId || null,
          messages:  [newUserMsg, newAssistantMsg]
        })
      }
    } catch (sessionErr) {
      console.error('Chat session save error:', sessionErr.message)
    }

    res.status(200).json({
      reply,
      sources,
      // Tells the frontend whether course materials provided context
      hasMaterialContext: materialExcerpts.length > 0
    })

  } catch (err) {
    console.error('Chat error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

/**
 * @route GET /api/chat/history/:courseId
 * @desc  Get the current user's chat history for a specific course
 * @access Private
 */
router.get('/history/:courseId', protect, async (req, res) => {
  try {
    const session = await ChatSession.findOne({
      userId:   req.user.id,
      courseId: req.params.courseId
    })
    res.status(200).json({ messages: session?.messages || [] })
  } catch (err) {
    console.error('Get chat history error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
