/**
 * @desc Project routes for UMBC Learn.
 * Handles project creation (pitch and assign),
 * approval workflow, and retrieval.
 *
 * POST  /api/projects/pitch            — student pitches a project
 * POST  /api/projects/assign           — instructor assigns a project
 * PATCH /api/projects/:id/approve      — approve a pitch
 * PATCH /api/projects/:id/reject       — reject a pitch with feedback
 * GET   /api/projects/mine             — current user's projects
 * GET   /api/projects/course/:courseId — all projects in a course
 * GET   /api/projects/pending/:courseId — pitch_pending projects only
 * GET   /api/projects/:id              — single project by ID
 * DELETE /api/projects/:id             — delete own project
 */
const express = require('express')
const router = express.Router()
const multer = require('multer')
const Project = require('../models/Project')
const Enrollment = require('../models/Enrollment')
const TAPermission = require('../models/TAPermission')
const { protect } = require('../middleware/auth')
const { instructorOrAbove, taOrAbove } = require('../middleware/roleCheck')
const { uploadToGridFS } = require('../utils/gridfs')
const {
  notifyProjectApproved,
  notifyProjectRejected
} = require('../utils/notificationService')

// Memory storage for proposal document uploads (max 10 MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ]
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only PDF and Word documents allowed'))
    }
  }
})

/**
 * @desc Check if the requesting user can approve/reject projects
 *   in a given course. Admins and instructors always can.
 *   TAs need the canApproveProjects flag set on their TAPermission record.
 * @param {string} userId - Requesting user's ID
 * @param {string} role - Requesting user's role
 * @param {string} courseId - Course the project belongs to
 * @returns {Promise<boolean>}
 */
async function canApproveInCourse(userId, role, courseId) {
  if (['admin', 'instructor'].includes(role)) return true
  const perm = await TAPermission.findOne({ taUserId: userId, courseId })
  return perm?.canApproveProjects === true
}

/**
 * @route POST /api/projects/pitch
 * @desc  Student pitches a project idea for instructor approval.
 *   Student must be enrolled and approved in the target course.
 *   Optional proposal document is uploaded to GridFS.
 * @access Private (student)
 */
router.post('/pitch', protect, upload.single('proposalDoc'),
  async (req, res) => {
    try {
      const { courseId, title, description, domain, language, skillLevel } = req.body

      if (!courseId || !title || !description) {
        return res.status(400).json({
          message: 'courseId, title, and description are required'
        })
      }

      // Student must be enrolled and approved before pitching
      const enrollment = await Enrollment.findOne({
        userId: req.user.id,
        courseId,
        status: 'approved'
      })
      if (!enrollment) {
        return res.status(403).json({
          message: 'You must be enrolled in this course to pitch a project'
        })
      }

      // Handle optional proposal document upload to GridFS
      let proposalDocId = null
      let proposalFileName = null
      if (req.file) {
        proposalDocId = await uploadToGridFS(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
          { type: 'proposal', userId: req.user.id, courseId }
        )
        proposalFileName = req.file.originalname
      }

      const project = await Project.create({
        userId: req.user.id,
        courseId: courseId,
        title,
        description,
        domain:      domain      || 'general',
        language:    language    || 'any',
        skillLevel:  skillLevel  || 'beginner',
        projectType: 'pitched',
        status:      'pitch_pending',
        proposalDocId,
        proposalFileName
      })

      const populated = await Project
        .findById(project._id)
        .populate('courseId', 'title code')
        .populate('userId', 'fullName email')

      res.status(201).json({
        message: 'Project pitch submitted. Awaiting instructor approval.',
        project: populated
      })

    } catch (err) {
      console.error('Project pitch error:', err)
      res.status(500).json({ message: 'Server error' })
    }
  }
)

/**
 * @route POST /api/projects/assign
 * @desc  Instructor assigns a project directly to a student.
 *   Project becomes active immediately — no approval step needed.
 * @access Instructor or Admin
 */
router.post('/assign', protect, instructorOrAbove, async (req, res) => {
  try {
    const { studentId, courseId, title, description, domain, language, skillLevel } = req.body

    if (!studentId || !courseId || !title || !description) {
      return res.status(400).json({
        message: 'studentId, courseId, title, and description are required'
      })
    }

    // Confirm the student is enrolled and approved in this course
    const enrollment = await Enrollment.findOne({
      userId: studentId,
      courseId,
      status: 'approved'
    })
    if (!enrollment) {
      return res.status(400).json({
        message: 'Student is not enrolled in this course'
      })
    }

    // Assigned projects skip the pitch flow and go straight to active
    const project = await Project.create({
      userId:      studentId,
      courseId,
      title,
      description,
      domain:      domain     || 'general',
      language:    language   || 'any',
      skillLevel:  skillLevel || 'beginner',
      projectType: 'assigned',
      status:      'active',
      assignedBy:  req.user.id,
      approvedBy:  req.user.id,
      approvedAt:  new Date()
    })

    const populated = await Project
      .findById(project._id)
      .populate('courseId', 'title code')
      .populate('userId', 'fullName email')
      .populate('assignedBy', 'fullName')

    res.status(201).json({
      message: 'Project assigned to student successfully',
      project: populated
    })

  } catch (err) {
    console.error('Project assign error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

/**
 * @route PATCH /api/projects/:id/approve
 * @desc  Approve a pitch_pending project.
 *   TAs must have canApproveProjects permission for the course.
 * @access Instructor, Admin, or TA with canApproveProjects
 */
router.patch('/:id/approve', protect, taOrAbove, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }
    if (project.status !== 'pitch_pending') {
      return res.status(400).json({ message: 'Project is not pending approval' })
    }

    const canApprove = await canApproveInCourse(
      req.user.id, req.user.role, project.courseId.toString()
    )
    if (!canApprove) {
      return res.status(403).json({
        message: 'You do not have permission to approve projects'
      })
    }

    project.status     = 'active'
    project.approvedBy = req.user.id
    project.approvedAt = new Date()
    await project.save()

    const populated = await Project
      .findById(project._id)
      .populate('userId', 'fullName email')
      .populate('courseId', 'title code')
      .populate('approvedBy', 'fullName')

    try {
      const student = populated.userId
      if (student?.email) {
        await notifyProjectApproved(student, populated)
      }
    } catch (err) {
      console.error('Project approval notification error:', err.message)
    }

    res.status(200).json({ message: 'Project approved successfully', project: populated })

  } catch (err) {
    console.error('Approve project error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

/**
 * @route PATCH /api/projects/:id/reject
 * @desc  Reject a pitch with optional feedback text.
 *   TAs must have canApproveProjects permission for the course.
 * @access Instructor, Admin, or TA with canApproveProjects
 */
router.patch('/:id/reject', protect, taOrAbove, async (req, res) => {
  try {
    const { feedback } = req.body
    const project = await Project.findById(req.params.id)

    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    const canApprove = await canApproveInCourse(
      req.user.id, req.user.role, project.courseId.toString()
    )
    if (!canApprove) {
      return res.status(403).json({
        message: 'You do not have permission to reject projects'
      })
    }

    project.status             = 'rejected'
    project.instructorFeedback = feedback || ''
    await project.save()

    try {
      const User = require('../models/User')
      const student = await User.findById(project.userId).select('fullName email')
      if (student?.email) {
        await notifyProjectRejected(student, project, feedback)
      }
    } catch (err) {
      console.error('Project rejection notification error:', err.message)
    }

    res.status(200).json({ message: 'Project rejected', project })

  } catch (err) {
    console.error('Reject project error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

/**
 * @route GET /api/projects/mine
 * @desc  Get all projects belonging to the current user
 * @access Private
 */
router.get('/mine', protect, async (req, res) => {
  try {
    const projects = await Project
      .find({ userId: req.user.id })
      .populate('courseId', 'title code semester')
      .populate('approvedBy', 'fullName')
      .sort({ createdAt: -1 })
    res.status(200).json(projects)
  } catch (err) {
    console.error('Get my projects error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

/**
 * @route GET /api/projects/course/:courseId
 * @desc  Get all projects in a course (any status)
 * @access TA or above
 */
router.get('/course/:courseId', protect, taOrAbove, async (req, res) => {
  try {
    const projects = await Project
      .find({ courseId: req.params.courseId })
      .populate('userId', 'fullName email skillLevel')
      .populate('approvedBy', 'fullName')
      .sort({ createdAt: -1 })
    res.status(200).json(projects)
  } catch (err) {
    console.error('Get course projects error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

/**
 * @route GET /api/projects/pending/:courseId
 * @desc  Get only pitch_pending projects for a course
 * @access TA or above
 */
router.get('/pending/:courseId', protect, taOrAbove, async (req, res) => {
  try {
    const projects = await Project
      .find({ courseId: req.params.courseId, status: 'pitch_pending' })
      .populate('userId', 'fullName email')
      .sort({ createdAt: -1 })
    res.status(200).json(projects)
  } catch (err) {
    console.error('Get pending projects error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

/**
 * @route GET /api/projects/:id
 * @desc  Get a single project by ID.
 *   Accessible by the owner, or any staff member.
 * @access Owner or staff (admin/instructor/ta)
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const project = await Project
      .findById(req.params.id)
      .populate('userId', 'fullName email')
      .populate('courseId', 'title code semester')
      .populate('approvedBy', 'fullName')
      .populate('assignedBy', 'fullName')

    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    const isOwner = project.userId._id.toString() === req.user.id
    const isStaff = ['admin', 'instructor', 'ta'].includes(req.user.role)

    if (!isOwner && !isStaff) {
      return res.status(403).json({ message: 'Access denied' })
    }

    res.status(200).json(project)
  } catch (err) {
    console.error('Get project error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

/**
 * @route DELETE /api/projects/:id
 * @desc  Delete a project. Owner only, any status.
 * @access Private (owner only)
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }
    if (project.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own projects' })
    }
    await Project.findByIdAndDelete(req.params.id)
    res.status(200).json({ message: 'Project deleted successfully' })
  } catch (err) {
    console.error('Delete project error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
