/**
 * @desc Department routes — admin CRUD for departments
 */
const express = require('express')
const router = express.Router()
const Department = require('../models/Department')
const { protect } = require('../middleware/auth')
const { adminOnly } = require('../middleware/roleCheck')

/**
 * @route GET /api/departments
 * @desc  Get all active departments
 * @access Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const departments = await Department
      .find({ isActive: true })
      .populate('headFaculty', 'fullName email')
      .sort({ name: 1 })
    res.status(200).json(departments)
  } catch (err) {
    console.error('Get departments error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

/**
 * @route POST /api/departments
 * @desc  Create a new department
 * @access Admin
 */
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { name, code, description, headFaculty } = req.body
    if (!name || !code) {
      return res.status(400).json({ message: 'Name and code are required' })
    }
    const department = await Department.create({
      name, code, description, headFaculty
    })
    res.status(201).json(department)
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        message: 'Department name or code already exists'
      })
    }
    console.error('Create department error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

/**
 * @route PUT /api/departments/:id
 * @desc  Update a department
 * @access Admin
 */
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    if (!department) {
      return res.status(404).json({ message: 'Department not found' })
    }
    res.status(200).json(department)
  } catch (err) {
    console.error('Update department error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

/**
 * @route DELETE /api/departments/:id
 * @desc  Soft delete a department (sets isActive false)
 * @access Admin
 */
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    )
    if (!department) {
      return res.status(404).json({ message: 'Department not found' })
    }
    res.status(200).json({ message: 'Department deactivated' })
  } catch (err) {
    console.error('Delete department error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
