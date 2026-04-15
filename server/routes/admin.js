/**
 * Admin routes
 * GET /api/admin/analytics — real counts for admin dashboard overview
 * GET /api/admin/users     — all users with optional search and role filter
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
 * @desc  Returns aggregate counts for the admin dashboard overview tab
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
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Project.countDocuments(),
      SavedResource.countDocuments(),
      SavedResource.countDocuments({ isCompleted: true }),
      Course.countDocuments({ isActive: true }),
      CourseMaterial.countDocuments({ isActive: true }),
      Project.countDocuments({ status: 'pitch_pending' }),
    ])
    return res.status(200).json({
      totalStudents,
      totalProjects,
      totalSaved,
      totalCompleted,
      totalCourses,
      totalMaterials,
      pendingPitches,
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

module.exports = router
