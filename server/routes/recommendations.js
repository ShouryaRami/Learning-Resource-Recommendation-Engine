/**
 * Recommendations route — POST /api/recommendations
 * Generates a three-source learning path for an active student project:
 *   1. Course materials (keyword-matched excerpts from uploaded files)
 *   2. YouTube tutorials (domain + language targeted videos)
 *   3. GitHub code examples (topic + language repositories)
 * Sources are fetched in parallel then merged with a Gemini narrative.
 */
const express = require('express')
const { protect } = require('../middleware/auth')
const Project = require('../models/Project')
const { searchMaterials } = require('../utils/materialSearch')
const { fetchYouTubeVideos } = require('../utils/youtubeAPI')
const { fetchGitHubRepos } = require('../utils/githubAPI')
const { generateLearningNarrative } = require('../utils/geminiAPI')

const router = express.Router()

/**
 * @route POST /api/recommendations
 * @desc Generate a learning path for a student project.
 *   Fetches course material excerpts, YouTube videos, and
 *   GitHub repos in parallel, then returns all three plus
 *   a Gemini-generated narrative explaining the sequence.
 * @access Private
 */
router.post('/', protect, async (req, res) => {
  try {
    const { projectId } = req.body

    if (!projectId) {
      return res.status(400).json({ message: 'projectId is required' })
    }

    // Load the project to get all context fields needed for each source
    const project = await Project.findById(projectId)

    console.log('Project found:', project ? 'yes' : 'no')
    console.log('Project userId:', project?.userId)
    console.log('Project status:', project?.status)
    console.log('req.user.id:', req.user.id)

    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    // Only the project owner or course staff should get recommendations
    if (project.userId.toString() !== req.user.id) {
      const allowedRoles = ['admin', 'instructor', 'ta']
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Access denied' })
      }
    }

    const title = project.title
    const description = project.description || ''
    const domain = project.domain || 'general'
    const language = project.language || 'any'
    const skillLevel = project.skillLevel || 'beginner'

    // courseId could be a populated object or a raw ObjectId
    // extract the string ID safely either way
    const courseIdStr = project.courseId?._id
      ? project.courseId._id.toString()
      : project.courseId?.toString()

    let courseMaterials = []
    let videos = []
    let codeExamples = []

    try {
      const query = `${title} ${description} ${domain} ${language}`
      console.log('Searching materials with courseId:', courseIdStr)
      courseMaterials = await searchMaterials(query, courseIdStr)
      console.log('Materials found:', courseMaterials.length)
    } catch (err) {
      console.error('MATERIALS FAILED:', err.message)
    }

    try {
      console.log('Fetching YouTube for:', domain, language, skillLevel)
      videos = await fetchYouTubeVideos(domain, language, skillLevel)
      console.log('Videos found:', videos.length)
    } catch (err) {
      console.error('YOUTUBE FAILED:', err.message)
    }

    try {
      console.log('Fetching GitHub for:', domain, language)
      codeExamples = await fetchGitHubRepos(domain, language)
      console.log('GitHub repos found:', codeExamples.length)
    } catch (err) {
      console.error('GITHUB FAILED:', err.message)
    }

    // Build material title list for the narrative generator
    const materialTitles = courseMaterials.map(m => m.title)

    // Gemini generates a 2-3 sentence explanation of the learning sequence
    const narrative = await generateLearningNarrative(title, materialTitles)

    // Learning path merges all sources in recommended study order:
    // 1. Course material foundations first
    // 2. Video tutorials to see concepts in action
    // 3. Code examples for hands-on practice
    const learningPath = [
      ...courseMaterials.map(m => ({ ...m, sourceType: 'courseMaterial' })),
      ...videos.map(v => ({ ...v, sourceType: 'video' })),
      ...codeExamples.map(g => ({ ...g, sourceType: 'github' }))
    ]

    // Persist recommendation references on the project document
    try {
      await Project.findByIdAndUpdate(projectId, {
        recommendations: courseMaterials.map(m => m.materialId).filter(Boolean)
      })
    } catch (saveErr) {
      // Non-fatal — recommendations still returned to client
      console.error('Failed to save recommendation IDs to project:', saveErr.message)
    }

    return res.status(200).json({
      courseMaterials,
      videos,
      codeExamples,
      learningPath,
      narrative
    })

  } catch (err) {
    console.error('Recommendations error:', err.message)
    return res.status(500).json({ message: 'Server error generating recommendations' })
  }
})

module.exports = router
