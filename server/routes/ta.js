/**
 * TA routes — manage and query per-course per-TA permissions.
 *
 * GET  /api/ta/permissions/:courseId   — get TA permissions for a course
 * PUT  /api/ta/permissions             — upsert TA permissions for a course
 * GET  /api/ta/permissions/check/:courseId — check current user's permissions
 * GET  /api/ta/courses                 — list courses where current user is a TA
 */
const express = require('express')
const router = express.Router()
const TAPermission = require('../models/TAPermission')
const Course = require('../models/Course')
const { protect } = require('../middleware/auth')
const { instructorOrAbove, taOrAbove } = require('../middleware/roleCheck')

/**
 * @desc  Get all TA permission records for a specific course.
 *   Returns an array (one entry per TA) so the instructor can see
 *   what each TA is allowed to do within this course.
 * @route GET /api/ta/permissions/:courseId
 * @access Instructor or Admin
 */
router.get('/permissions/:courseId', protect, instructorOrAbove, async (req, res) => {
  try {
    const permissions = await TAPermission
      .find({ courseId: req.params.courseId })
      .populate('taUserId', 'fullName email')
      .populate('grantedBy', 'fullName')
    res.status(200).json(permissions)
  } catch (err) {
    console.error('Get TA permissions error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

/**
 * @desc  Create or update (upsert) the permission record for one TA in one course.
 *   If a record already exists for this taUserId + courseId pair it is updated;
 *   otherwise a new record is created. grantedBy is always set to the requester.
 * @route PUT /api/ta/permissions
 * @access Instructor or Admin
 * @body  { taUserId, courseId, canApproveEnrollments, canViewStudentReports,
 *          canApproveProjects, canAddResources, canDeleteResources,
 *          canRemoveStudents, canGradeStudents }
 */
router.put('/permissions', protect, instructorOrAbove, async (req, res) => {
  try {
    const {
      taUserId,
      courseId,
      canApproveEnrollments,
      canViewStudentReports,
      canApproveProjects,
      canAddResources,
      canDeleteResources,
      canRemoveStudents,
      canGradeStudents,
    } = req.body

    if (!taUserId || !courseId) {
      return res.status(400).json({ message: 'taUserId and courseId are required' })
    }

    const permission = await TAPermission.findOneAndUpdate(
      { taUserId, courseId },
      {
        taUserId,
        courseId,
        grantedBy: req.user.id,
        canApproveEnrollments:  !!canApproveEnrollments,
        canViewStudentReports:  !!canViewStudentReports,
        canApproveProjects:     !!canApproveProjects,
        canAddResources:        !!canAddResources,
        canDeleteResources:     !!canDeleteResources,
        canRemoveStudents:      !!canRemoveStudents,
        canGradeStudents:       !!canGradeStudents,
        updatedAt:              new Date(),
      },
      { upsert: true, new: true, runValidators: true }
    )
      .populate('taUserId', 'fullName email')
      .populate('grantedBy', 'fullName')

    res.status(200).json({ message: 'Permissions updated', permission })
  } catch (err) {
    console.error('Upsert TA permissions error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

/**
 * @desc  Check the current user's permissions for a specific course.
 *   Admins and instructors always receive all permissions as true so the
 *   frontend does not need to special-case these roles — it just reads flags.
 *   TAs receive their actual stored permission record (or all-false if none set).
 * @route GET /api/ta/permissions/check/:courseId
 * @access TA or above
 */
router.get('/permissions/check/:courseId', protect, taOrAbove, async (req, res) => {
  try {
    // Admin and instructor have full access — return all flags true
    if (['admin', 'instructor'].includes(req.user.role)) {
      return res.status(200).json({
        canApproveEnrollments: true,
        canViewStudentReports: true,
        canApproveProjects:    true,
        canAddResources:       true,
        canDeleteResources:    true,
        canRemoveStudents:     true,
        canGradeStudents:      true,
      })
    }

    // Look up the TA's actual permission record for this course
    const permission = await TAPermission.findOne({
      taUserId:  req.user.id,
      courseId:  req.params.courseId,
    })

    if (!permission) {
      // No record means no permissions have been granted yet
      return res.status(200).json({
        canApproveEnrollments: false,
        canViewStudentReports: false,
        canApproveProjects:    false,
        canAddResources:       false,
        canDeleteResources:    false,
        canRemoveStudents:     false,
        canGradeStudents:      false,
      })
    }

    res.status(200).json({
      canApproveEnrollments: permission.canApproveEnrollments,
      canViewStudentReports: permission.canViewStudentReports,
      canApproveProjects:    permission.canApproveProjects,
      canAddResources:       permission.canAddResources,
      canDeleteResources:    permission.canDeleteResources,
      canRemoveStudents:     permission.canRemoveStudents,
      canGradeStudents:      permission.canGradeStudents,
    })
  } catch (err) {
    console.error('Check TA permissions error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

/**
 * @desc  List all courses where the current user is assigned as a TA.
 *   Used by the TA dashboard to populate the course list on login.
 * @route GET /api/ta/courses
 * @access TA or above
 */
router.get('/courses', protect, taOrAbove, async (req, res) => {
  try {
    const courses = await Course
      .find({ tas: req.user.id, isActive: true })
      .populate('department', 'name code')
      .populate('faculty', 'fullName email')
      .sort({ createdAt: -1 })
    res.status(200).json(courses)
  } catch (err) {
    console.error('Get TA courses error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
