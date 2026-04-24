/**
 * @desc Tips routes
 * Handles CRUD for CourseTip documents.
 * Instructors and TAs can create, update, and delete tips.
 * Students see only tips where isVisibleToStudents is true.
 */
const express = require('express')
const router = express.Router()
const { body } = require('express-validator')
const CourseTip = require('../models/CourseTip')
const Course = require('../models/Course')
const TAPermission = require('../models/TAPermission')
const { protect } = require('../middleware/auth')
const { taOrAbove } = require('../middleware/roleCheck')
const { handleValidation } = require('../middleware/validate')

/**
 * @route POST /api/tips
 * @desc Create a new course tip or tool recommendation
 * @access TA or above (instructor, dept head, admin)
 */
router.post(
  '/',
  protect,
  taOrAbove,
  [
    body('courseId').notEmpty().withMessage('courseId is required'),
    body('title')
      .notEmpty().trim().withMessage('Title is required')
      .isLength({ max: 200 }).withMessage('Title max 200 characters'),
    body('content')
      .notEmpty().trim().withMessage('Content is required')
      .isLength({ max: 2000 }).withMessage('Content max 2000 characters'),
    body('category')
      .optional()
      .isIn(['study_tip', 'tool_recommendation', 'resource_link', 'general'])
      .withMessage('Invalid category'),
    body('toolUrl').optional().trim()
  ],
  handleValidation,
  async (req, res) => {
    try {
      const { courseId, title, content, category, toolUrl } = req.body

      const course = await Course.findById(courseId)
      if (!course || !course.isActive) {
        return res.status(404).json({ message: 'Course not found' })
      }

      // TAs must have canAddResources permission for this course
      if (req.user.role === 'ta') {
        const perm = await TAPermission.findOne({
          taUserId: req.user.id,
          courseId
        })
        if (!perm || !perm.canAddResources) {
          return res.status(403).json({
            message: 'You do not have permission to add tips'
          })
        }
      }

      const tip = await CourseTip.create({
        courseId,
        createdBy: req.user.id,
        title,
        content,
        category: category || 'general',
        toolUrl: toolUrl || ''
      })

      await tip.populate('createdBy', 'fullName role')

      res.status(201).json({ message: 'Tip created successfully', tip })
    } catch (err) {
      console.error('Create tip error:', err)
      res.status(500).json({ message: 'Server error' })
    }
  }
)

/**
 * @route GET /api/tips/course/:courseId
 * @desc Get all active tips for a course
 * @access Private — students see only isVisibleToStudents tips
 */
router.get('/course/:courseId', protect, async (req, res) => {
  try {
    const filter = {
      courseId: req.params.courseId,
      isActive: true
    }

    if (req.user.role === 'student') {
      filter.isVisibleToStudents = true
    }

    const tips = await CourseTip.find(filter)
      .populate('createdBy', 'fullName role')
      .sort({ createdAt: -1 })

    res.status(200).json(tips)
  } catch (err) {
    console.error('Get tips error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

/**
 * @route PATCH /api/tips/:id
 * @desc Update a tip — creator or admin only
 * @access TA or above
 */
router.patch('/:id', protect, taOrAbove, async (req, res) => {
  try {
    const tip = await CourseTip.findById(req.params.id)

    if (!tip || !tip.isActive) {
      return res.status(404).json({ message: 'Tip not found' })
    }

    const isCreator = tip.createdBy.toString() === req.user.id
    const isAdmin = req.user.role === 'admin'
    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        message: 'You can only edit your own tips'
      })
    }

    const allowed = ['title', 'content', 'category', 'toolUrl', 'isVisibleToStudents']
    allowed.forEach(field => {
      if (req.body[field] !== undefined) {
        tip[field] = req.body[field]
      }
    })
    tip.updatedAt = new Date()
    await tip.save()

    await tip.populate('createdBy', 'fullName role')
    res.status(200).json({ message: 'Tip updated', tip })
  } catch (err) {
    console.error('Update tip error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

/**
 * @route DELETE /api/tips/:id
 * @desc Soft delete a tip — creator or admin only
 * @access TA or above
 */
router.delete('/:id', protect, taOrAbove, async (req, res) => {
  try {
    const tip = await CourseTip.findById(req.params.id)

    if (!tip || !tip.isActive) {
      return res.status(404).json({ message: 'Tip not found' })
    }

    const isCreator = tip.createdBy.toString() === req.user.id
    const isAdmin = req.user.role === 'admin'
    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        message: 'You can only delete your own tips'
      })
    }

    tip.isActive = false
    tip.updatedAt = new Date()
    await tip.save()

    res.status(200).json({ message: 'Tip removed' })
  } catch (err) {
    console.error('Delete tip error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

/**
 * @route PATCH /api/tips/:id/visibility
 * @desc Toggle student visibility for a tip
 * @access TA or above
 */
router.patch('/:id/visibility', protect, taOrAbove, async (req, res) => {
  try {
    const tip = await CourseTip.findById(req.params.id)

    if (!tip || !tip.isActive) {
      return res.status(404).json({ message: 'Tip not found' })
    }

    tip.isVisibleToStudents = !tip.isVisibleToStudents
    tip.updatedAt = new Date()
    await tip.save()

    res.status(200).json({
      message: tip.isVisibleToStudents
        ? 'Tip is now visible to students'
        : 'Tip hidden from students',
      isVisibleToStudents: tip.isVisibleToStudents
    })
  } catch (err) {
    console.error('Toggle tip visibility error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
