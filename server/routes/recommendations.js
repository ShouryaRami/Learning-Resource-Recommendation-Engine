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
const Course = require('../models/Course')
const { searchMaterials, searchTips } = require('../utils/materialSearch')
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

    // Check if AI processing is enabled for this course
    let aiEnabled = true
    if (courseIdStr) {
      try {
        const courseDoc = await Course.findById(courseIdStr).select('aiProcessingEnabled')
        if (courseDoc && courseDoc.aiProcessingEnabled === false) aiEnabled = false
      } catch (err) {
        console.error('AI toggle check error:', err.message)
      }
    }

    let courseMaterials = []
    let tipResults     = []
    let videos         = []
    let codeExamples   = []

    if (aiEnabled) {
      try {
        const query = `${title} ${description} ${domain} ${language}`
        courseMaterials = await searchMaterials(query, courseIdStr)
      } catch (err) {
        console.error('Materials search failed:', err.message)
      }

      try {
        if (courseIdStr) {
          const query = `${title} ${description} ${domain}`
          tipResults = await searchTips(query, courseIdStr)
        }
      } catch (err) {
        console.error('Tips recommendation error:', err.message)
      }
    }

    try {
      videos = await fetchYouTubeVideos(domain, language, skillLevel)
    } catch (err) {
      console.error('YouTube fetch failed:', err.message)
    }

    try {
      codeExamples = await fetchGitHubRepos(domain, language)
    } catch (err) {
      console.error('GitHub fetch failed:', err.message)
    }

    const materialTitles = courseMaterials.map(m => m.title)
    const narrative = aiEnabled
      ? await generateLearningNarrative(title, materialTitles)
      : ''

    const learningPath = [
      ...courseMaterials.map(m => ({ ...m, sourceType: 'courseMaterial' })),
      ...videos.map(v => ({ ...v, sourceType: 'video' })),
      ...codeExamples.map(g => ({ ...g, sourceType: 'github' }))
    ]

    try {
      await Project.findByIdAndUpdate(projectId, {
        recommendations: courseMaterials.map(m => m.materialId).filter(Boolean)
      })
    } catch (saveErr) {
      console.error('Failed to save recommendation IDs to project:', saveErr.message)
    }

    return res.status(200).json({
      courseMaterials,
      instructorTips: tipResults,
      videos,
      codeExamples,
      learningPath,
      narrative,
      summary: {
        materialCount: courseMaterials.length,
        tipCount:      tipResults.length,
        videoCount:    videos.length,
        codeCount:     codeExamples.length,
        totalSteps:    learningPath.length
      }
    })

  } catch (err) {
    console.error('Recommendations error:', err.message)
    return res.status(500).json({ message: 'Server error generating recommendations' })
  }
})

/**
 * @route GET /api/recommendations/:projectId
 * @desc  Generate a learning path for a project — same logic as POST
 *   but reads projectId from URL param so the frontend can use
 *   axiosInstance.get('/recommendations/' + projectId).
 * @access Private
 */
router.get('/:projectId', protect, async (req, res) => {
  try {
    const { projectId } = req.params

    const project = await Project.findById(projectId)

    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    if (project.userId.toString() !== req.user.id) {
      const allowedRoles = ['admin', 'instructor', 'ta']
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Access denied' })
      }
    }

    const title       = project.title
    const description = project.description || ''
    const domain      = project.domain      || 'general'
    const language    = project.language    || 'any'
    const skillLevel  = project.skillLevel  || 'beginner'

    const courseIdStr = project.courseId?._id
      ? project.courseId._id.toString()
      : project.courseId?.toString()

    // Check if AI processing is enabled for this course
    let aiEnabled = true
    if (courseIdStr) {
      try {
        const courseDoc = await Course.findById(courseIdStr).select('aiProcessingEnabled')
        if (courseDoc && courseDoc.aiProcessingEnabled === false) aiEnabled = false
      } catch (err) {
        console.error('AI toggle check error:', err.message)
      }
    }

    let courseMaterials = []
    let tipResults      = []
    let videos          = []
    let codeExamples    = []

    if (aiEnabled) {
      try {
        const query = `${title} ${description} ${domain} ${language}`
        courseMaterials = await searchMaterials(query, courseIdStr)
      } catch (err) {
        console.error('Materials search failed:', err.message)
      }

      try {
        if (courseIdStr) {
          const query = `${title} ${description} ${domain}`
          tipResults = await searchTips(query, courseIdStr)
        }
      } catch (err) {
        console.error('Tips recommendation error:', err.message)
      }
    }

    try {
      videos = await fetchYouTubeVideos(domain, language, skillLevel)
    } catch (err) {
      console.error('YouTube fetch failed:', err.message)
    }

    try {
      codeExamples = await fetchGitHubRepos(domain, language)
    } catch (err) {
      console.error('GitHub fetch failed:', err.message)
    }

    const materialTitles = courseMaterials.map(m => m.title)
    const narrative      = aiEnabled
      ? await generateLearningNarrative(title, materialTitles)
      : ''

    const learningPath = [
      ...courseMaterials.map(m => ({ ...m, sourceType: 'courseMaterial' })),
      ...videos.map(v => ({ ...v, sourceType: 'video' })),
      ...codeExamples.map(g => ({ ...g, sourceType: 'github' })),
    ]

    try {
      await Project.findByIdAndUpdate(projectId, {
        recommendations: courseMaterials.map(m => m.materialId).filter(Boolean)
      })
    } catch (saveErr) {
      console.error('Failed to save recommendation IDs:', saveErr.message)
    }

    return res.status(200).json({
      courseMaterials,
      instructorTips: tipResults,
      videos,
      codeExamples,
      learningPath,
      narrative,
      summary: {
        materialCount: courseMaterials.length,
        tipCount:      tipResults.length,
        videoCount:    videos.length,
        codeCount:     codeExamples.length,
        totalSteps:    learningPath.length
      }
    })

  } catch (err) {
    console.error('Recommendations GET error:', err.message)
    return res.status(500).json({ message: 'Server error generating recommendations' })
  }
})

module.exports = router
