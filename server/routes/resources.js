/**
 * Resources routes
 * GET /api/resources — list all resources (admin only)
 */
const express = require('express')
const router = express.Router()
const Resource = require('../models/Resource')
const { protect } = require('../middleware/auth')
const { adminOnly } = require('../middleware/roleCheck')

/**
 * @route GET /api/resources
 * @desc  Get all resources sorted by creation date
 * @access Admin
 */
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const resources = await Resource
      .find()
      .sort({ createdAt: -1 })
    res.status(200).json(resources)
  } catch (err) {
    console.error('Get resources error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
