/**
 * @desc Course routes — CRUD and faculty/TA assignment
 */
const express = require('express')
const router = express.Router()
const Course = require('../models/Course')
const Enrollment = require('../models/Enrollment')
const User = require('../models/User')
const { protect } = require('../middleware/auth')
const { adminOnly, instructorOrAbove, taOrAbove, deptHeadOrAbove } = require('../middleware/roleCheck')

/**
 * @route GET /api/courses
 * @desc  Get all active courses with department and faculty info
 * @access Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const courses = await Course
      .find({ isActive: true })
      .populate('department', 'name code')
      .populate('faculty', 'fullName email isDepartmentHead')
      .populate('tas', 'fullName email')
      .sort({ createdAt: -1 })
    res.status(200).json(courses)
  } catch (err) {
    console.error('Get courses error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

/**
 * @route GET /api/courses/:id
 * @desc  Get a single course by ID
 * @access Private
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const course = await Course
      .findById(req.params.id)
      .populate('department', 'name code')
      .populate('faculty', 'fullName email isDepartmentHead')
      .populate('tas', 'fullName email')
      .populate('createdBy', 'fullName')
    if (!course) {
      return res.status(404).json({ message: 'Course not found' })
    }
    res.status(200).json(course)
  } catch (err) {
    console.error('Get course error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

/**
 * @route POST /api/courses
 * @desc  Create a new course
 * @access Admin or Department Head
 */
router.post('/', protect, deptHeadOrAbove, async (req, res) => {
  try {
    const { title, code, description, department,
      semester, domains, maxStudents,
      enrollmentOpen, faculty, tas } = req.body
    if (!title || !code || !department) {
      return res.status(400).json({
        message: 'Title, code, and department are required'
      })
    }
    const course = await Course.create({
      title, code, description, department,
      semester, domains,
      maxStudents: maxStudents || 30,
      enrollmentOpen: enrollmentOpen !== false,
      faculty: faculty || [],
      tas: tas || [],
      createdBy: req.user.id,
      isActive: true
    })
    // Re-fetch with populated fields for the response
    const populated = await Course
      .findById(course._id)
      .populate('department', 'name code')
      .populate('faculty', 'fullName email')
      .populate('tas', 'fullName email')
    res.status(201).json({ message: 'Course created', course: populated })
  } catch (err) {
    console.error('Create course error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

/**
 * @route PUT /api/courses/:id
 * @desc  Update a course (instructor can only update limited fields)
 * @access Admin or assigned Instructor
 */
router.put('/:id', protect, instructorOrAbove, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
    if (!course) {
      return res.status(404).json({ message: 'Course not found' })
    }
    // Instructors can only update description, domains, and enrollmentOpen
    // Admin can update everything
    let updateData = req.body
    if (req.user.role === 'instructor') {
      const { description, domains, enrollmentOpen } = req.body
      updateData = { description, domains, enrollmentOpen }
    }
    const updated = await Course.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('department', 'name code')
    res.status(200).json(updated)
  } catch (err) {
    console.error('Update course error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

/**
 * @route DELETE /api/courses/:id
 * @desc  Soft delete a course (sets isActive false)
 * @access Admin or Department Head
 */
router.delete('/:id', protect, deptHeadOrAbove, async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    )
    if (!course) {
      return res.status(404).json({ message: 'Course not found' })
    }
    res.status(200).json({ message: 'Course deactivated' })
  } catch (err) {
    console.error('Delete course error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

/**
 * @route POST /api/courses/:id/assign-faculty
 * @desc  Assign an instructor to a course
 * @access Admin
 */
router.post('/:id/assign-faculty', protect, adminOnly, async (req, res) => {
  try {
    const { userId } = req.body
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' })
    }
    const user = await User.findById(userId)
    if (!user || user.role !== 'instructor') {
      return res.status(400).json({
        message: 'User not found or is not an instructor'
      })
    }
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { faculty: userId } },
      { new: true }
    ).populate('faculty', 'fullName email')
    if (!course) {
      return res.status(404).json({ message: 'Course not found' })
    }
    res.status(200).json({ message: 'Faculty assigned successfully', course })
  } catch (err) {
    console.error('Assign faculty error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

/**
 * @route POST /api/courses/:id/assign-ta
 * @desc  Assign a TA to a course
 * @access Admin or Instructor
 */
router.post('/:id/assign-ta', protect, instructorOrAbove, async (req, res) => {
  try {
    const { userId } = req.body
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' })
    }
    const user = await User.findById(userId)
    if (!user || !['ta', 'instructor'].includes(user.role)) {
      return res.status(400).json({
        message: 'User not found or is not a TA or instructor'
      })
    }
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { tas: userId } },
      { new: true }
    ).populate('tas', 'fullName email')
    if (!course) {
      return res.status(404).json({ message: 'Course not found' })
    }
    res.status(200).json({ message: 'TA assigned successfully', course })
  } catch (err) {
    console.error('Assign TA error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

/**
 * @route PATCH /api/courses/:id/ai-toggle
 * @desc  Toggle AI processing for course materials.
 *   When disabled, extracted text is not sent to Gemini.
 * @access Instructor or above
 */
router.patch('/:id/ai-toggle', protect, instructorOrAbove, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
    if (!course || !course.isActive) {
      return res.status(404).json({ message: 'Course not found' })
    }
    course.aiProcessingEnabled = !course.aiProcessingEnabled
    await course.save()
    res.status(200).json({
      message: course.aiProcessingEnabled
        ? 'AI processing enabled for this course'
        : 'AI processing disabled for this course',
      aiProcessingEnabled: course.aiProcessingEnabled
    })
  } catch (err) {
    console.error('AI toggle error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

/**
 * @route GET /api/courses/:id/students
 * @desc  Get all approved students enrolled in a course
 * @access TA or above
 */
router.get('/:id/students', protect, taOrAbove, async (req, res) => {
  try {
    const enrollments = await Enrollment
      .find({ courseId: req.params.id, status: 'approved' })
      .populate('userId', 'fullName email skillLevel createdAt')
      .sort({ approvedAt: -1 })
    res.status(200).json(enrollments)
  } catch (err) {
    console.error('Get students error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
