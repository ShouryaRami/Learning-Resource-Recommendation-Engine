/**
 * @desc Enrollment routes — student requests and faculty/TA approvals
 */
const express = require('express')
const router = express.Router()
const Enrollment = require('../models/Enrollment')
const Course = require('../models/Course')
const { protect } = require('../middleware/auth')
const { taOrAbove } = require('../middleware/roleCheck')

/**
 * @route POST /api/enrollments
 * @desc  Student requests enrollment in a course
 * @access Private (student)
 */
router.post('/', protect, async (req, res) => {
  try {
    const { courseId } = req.body
    if (!courseId) {
      return res.status(400).json({ message: 'courseId is required' })
    }

    // Verify course exists and is accepting enrollment
    const course = await Course.findById(courseId)
    if (!course || !course.isActive) {
      return res.status(404).json({ message: 'Course not found' })
    }
    if (!course.enrollmentOpen) {
      return res.status(400).json({
        message: 'Enrollment is closed for this course'
      })
    }

    // Prevent duplicate enrollment requests
    const existing = await Enrollment.findOne({
      userId: req.user.id,
      courseId
    })
    if (existing) {
      return res.status(400).json({
        message: 'You have already requested enrollment in this course',
        status: existing.status
      })
    }

    // Enforce max student cap before creating the record
    const approvedCount = await Enrollment.countDocuments({
      courseId,
      status: 'approved'
    })
    if (approvedCount >= course.maxStudents) {
      return res.status(400).json({
        message: 'This course has reached maximum enrollment'
      })
    }

    const enrollment = await Enrollment.create({
      userId: req.user.id,
      courseId
    })

    res.status(201).json({
      message: 'Enrollment request submitted successfully',
      enrollment
    })
  } catch (err) {
    console.error('Enrollment request error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

/**
 * @route PATCH /api/enrollments/:id/approve
 * @desc  Approve a pending enrollment request
 * @access TA or above
 */
router.patch('/:id/approve', protect, taOrAbove, async (req, res) => {
  try {
    const enrollment = await Enrollment.findByIdAndUpdate(
      req.params.id,
      {
        status: 'approved',
        approvedBy: req.user.id,
        approvedAt: new Date()
      },
      { new: true }
    )
      .populate('userId', 'fullName email')
      .populate('courseId', 'title code')

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' })
    }
    res.status(200).json({ message: 'Enrollment approved', enrollment })
  } catch (err) {
    console.error('Approve enrollment error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

/**
 * @route PATCH /api/enrollments/:id/reject
 * @desc  Reject an enrollment request
 * @access TA or above
 */
router.patch('/:id/reject', protect, taOrAbove, async (req, res) => {
  try {
    const enrollment = await Enrollment.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    )
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' })
    }
    res.status(200).json({ message: 'Enrollment rejected', enrollment })
  } catch (err) {
    console.error('Reject enrollment error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

/**
 * @route GET /api/enrollments/course/:courseId
 * @desc  Get all enrollments for a specific course
 * @access TA or above
 */
router.get('/course/:courseId', protect, taOrAbove, async (req, res) => {
  try {
    const filter = { courseId: req.params.courseId }
    if (req.query.status) filter.status = req.query.status
    const enrollments = await Enrollment
      .find(filter)
      .populate('userId', 'fullName email skillLevel')
      .populate('courseId', 'title code')
      .populate('approvedBy', 'fullName')
      .sort({ requestedAt: -1 })
    res.status(200).json(enrollments)
  } catch (err) {
    console.error('Get course enrollments error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

/**
 * @route GET /api/enrollments/me
 * @desc  Get all enrollments for the current logged-in user
 * @access Private
 */
router.get('/me', protect, async (req, res) => {
  try {
    const enrollments = await Enrollment
      .find({ userId: req.user.id })
      .populate('courseId', 'title code semester department')
      .sort({ requestedAt: -1 })
    res.status(200).json(enrollments)
  } catch (err) {
    console.error('Get my enrollments error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
