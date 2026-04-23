/**
 * Admin routes
 * GET   /api/admin/analytics                     — dashboard aggregate counts
 * GET   /api/admin/users                         — all users with filter/search
 * PATCH /api/admin/users/:id                     — update role / isDepartmentHead / isActive
 * GET   /api/admin/student/:studentId/projects   — all projects for one student
 */
const express = require('express')
const { protect } = require('../middleware/auth')
const { adminOnly } = require('../middleware/roleCheck')
const User = require('../models/User')
const Project = require('../models/Project')
const SavedResource = require('../models/SavedResource')
const CourseMaterial = require('../models/CourseMaterial')
const Course = require('../models/Course')

const router = express.Router()

/**
 * @route GET /api/admin/analytics
 * @desc  Aggregate counts for the admin overview dashboard
 * @access Admin
 */
router.get('/analytics', protect, adminOnly, async (req, res) => {
  try {
    const [
      totalStudents,
      totalProjects,
      totalSaved,
      totalCompleted,
      totalCourses,
      totalMaterials,
      pendingPitches,
      activeProjects,
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Project.countDocuments(),
      SavedResource.countDocuments(),
      SavedResource.countDocuments({ isCompleted: true }),
      Course.countDocuments({ isActive: true }),
      CourseMaterial.countDocuments({ isActive: true }),
      Project.countDocuments({ status: 'pitch_pending' }),
      Project.countDocuments({ status: 'active' }),
    ])
    return res.status(200).json({
      totalStudents,
      totalProjects,
      totalSaved,
      totalCompleted,
      totalCourses,
      totalMaterials,
      pendingPitches,
      activeProjects,
    })
  } catch (err) {
    console.error('Analytics error:', err)
    return res.status(500).json({ message: 'Server error fetching analytics' })
  }
})

/**
 * @route GET /api/admin/users
 * @desc  Get all users with optional role filter and name/email search
 * @access Admin
 */
router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const { role, search } = req.query
    const filter = {}
    if (role && role !== 'all') filter.role = role
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email:    { $regex: search, $options: 'i' } },
      ]
    }
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
    res.status(200).json(users)
  } catch (err) {
    console.error('Get users error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

/**
 * @route PATCH /api/admin/users/:id
 * @desc  Update a user's role, isDepartmentHead flag, or isActive status
 * @access Admin
 */
router.patch('/users/:id', protect, adminOnly, async (req, res) => {
  try {
    const { role, isDepartmentHead, isActive } = req.body
    const updateFields = {}
    if (role !== undefined)               updateFields.role = role
    if (isDepartmentHead !== undefined)   updateFields.isDepartmentHead = isDepartmentHead
    if (isActive !== undefined)           updateFields.isActive = isActive

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    ).select('-password')

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    res.status(200).json({ message: 'User updated', user })
  } catch (err) {
    console.error('Update user error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

/**
 * @route GET /api/admin/student/:studentId/projects
 * @desc  Get all projects belonging to a specific student
 * @access Admin
 */
router.get('/student/:studentId/projects', protect, adminOnly, async (req, res) => {
  try {
    const projects = await Project
      .find({ userId: req.params.studentId })
      .populate('courseId', 'title code')
      .sort({ createdAt: -1 })
    res.status(200).json(projects)
  } catch (err) {
    console.error('Get student projects error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

/**
 * @route GET /api/admin/projects
 * @desc  Get all projects with optional status filter
 * @access Admin
 */
router.get('/projects', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.query
    const filter = {}
    if (status) filter.status = status
    const projects = await Project
      .find(filter)
      .populate('userId',   'fullName email')
      .populate('courseId', 'title code')
      .sort({ createdAt: -1 })
    res.status(200).json(projects)
  } catch (err) {
    console.error('Admin get projects error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
