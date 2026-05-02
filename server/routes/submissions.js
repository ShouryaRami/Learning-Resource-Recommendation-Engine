/**
 * @desc Submissions routes
 * Handles student deliverable submissions and
 * instructor grading workflow.
 *
 * POST   /api/submissions              — student submits deliverable
 * GET    /api/submissions/my           — student's own submissions
 * GET    /api/submissions/course/:id   — all submissions for a course
 * PATCH  /api/submissions/:id/grade    — instructor records grade
 */
const express = require('express')
const router = express.Router()
const Submission = require('../models/Submission')
const Project = require('../models/Project')
const { protect } = require('../middleware/auth')
const { instructorOrAbove } = require('../middleware/roleCheck')

/**
 * @route POST /api/submissions
 * @desc  Student submits a deliverable for an approved project.
 *   Only one submission per project is allowed — use grade route to update.
 * @access Private (student)
 */
router.post('/', protect, async (req, res) => {
  try {
    const { projectId, title, description, deliverableUrl } = req.body

    if (!projectId || !title) {
      return res.status(400).json({
        message: 'projectId and title are required'
      })
    }

    const project = await Project.findById(projectId)
    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    if (project.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'This is not your project' })
    }

    if (project.status !== 'active') {
      return res.status(400).json({
        message: 'Project must be approved before submitting'
      })
    }

    const existing = await Submission.findOne({
      projectId,
      studentId: req.user.id
    })
    if (existing) {
      return res.status(400).json({
        message: 'You have already submitted for this project'
      })
    }

    const submission = await Submission.create({
      projectId,
      studentId:      req.user.id,
      courseId:       project.courseId,
      title,
      description:    description    || '',
      deliverableUrl: deliverableUrl || '',
      status:         'submitted'
    })

    res.status(201).json({ message: 'Submission received', submission })
  } catch (err) {
    console.error('Create submission error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

/**
 * @route GET /api/submissions/my
 * @desc  Get all submissions by the logged-in student
 * @access Private
 */
router.get('/my', protect, async (req, res) => {
  try {
    const submissions = await Submission
      .find({ studentId: req.user.id })
      .populate('projectId', 'title domain language')
      .populate('courseId', 'title code')
      .sort({ submittedAt: -1 })

    res.status(200).json(submissions)
  } catch (err) {
    console.error('Get my submissions error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

/**
 * @route GET /api/submissions/course/:courseId
 * @desc  Get all submissions for a course
 * @access Instructor or above
 */
router.get('/course/:courseId', protect, instructorOrAbove, async (req, res) => {
  try {
    const submissions = await Submission
      .find({ courseId: req.params.courseId })
      .populate('studentId', 'fullName email')
      .populate('projectId', 'title domain language')
      .sort({ submittedAt: -1 })

    res.status(200).json(submissions)
  } catch (err) {
    console.error('Get course submissions error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

/**
 * @route PATCH /api/submissions/:id/grade
 * @desc  Instructor records a grade and optional feedback
 * @access Instructor or above
 */
router.patch('/:id/grade', protect, instructorOrAbove, async (req, res) => {
  try {
    const { grade, feedback } = req.body

    if (!grade) {
      return res.status(400).json({ message: 'Grade is required' })
    }

    const submission = await Submission.findById(req.params.id)
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' })
    }

    submission.grade    = grade
    submission.feedback = feedback || ''
    submission.gradedBy = req.user.id
    submission.gradedAt = new Date()
    submission.status   = 'graded'
    await submission.save()

    res.status(200).json({ message: 'Grade recorded', submission })
  } catch (err) {
    console.error('Grade submission error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
