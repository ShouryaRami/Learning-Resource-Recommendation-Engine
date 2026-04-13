/**
 * @desc AI routes for UMBC Learn.
 * Handles project proposal analysis via Gemini 2.5 Flash.
 * RAG chat is handled separately in routes/chat.js.
 */
const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const { analyzeProposal } = require('../utils/geminiAPI')
const Project = require('../models/Project')

/**
 * @route POST /api/ai/analyze-proposal
 * @desc  Analyze a project proposal using Gemini AI.
 *   Builds proposal text from the project document fields,
 *   sends to Gemini, saves the analysis back to the project,
 *   and returns it for display to the student and instructor.
 * @access Private
 */
router.post('/analyze-proposal', protect, async (req, res) => {
  try {
    const { projectId } = req.body
    if (!projectId) {
      return res.status(400).json({ message: 'projectId is required' })
    }

    const project = await Project
      .findById(projectId)
      .populate('courseId', 'title')

    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    // Build a structured proposal text from the project fields
    const proposalText =
      `Title: ${project.title}\n` +
      `Description: ${project.description}\n` +
      `Domain: ${project.domain}\n` +
      `Language: ${project.language}\n` +
      `Skill Level: ${project.skillLevel}`

    const analysis = await analyzeProposal(
      proposalText,
      project.courseId?.title || ''
    )

    // Persist analysis so instructor can see it on the pitch review page
    await Project.findByIdAndUpdate(projectId, { aiAnalysis: analysis })

    res.status(200).json({ analysis })
  } catch (err) {
    console.error('Analyze proposal error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
