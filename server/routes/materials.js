/**
 * @desc Course material routes.
 * Handles upload, listing, download, and deletion
 * of course materials. Files stored in MongoDB GridFS.
 * Text is extracted async after upload for RAG search.
 */
const express = require('express')
const router = express.Router()
const multer = require('multer')
const CourseMaterial = require('../models/CourseMaterial')
const Course = require('../models/Course')
const TAPermission = require('../models/TAPermission')
const { protect } = require('../middleware/auth')
const { taOrAbove } = require('../middleware/roleCheck')
const { uploadToGridFS, streamFromGridFS } = require('../utils/gridfs')
const { extractText } = require('../utils/textExtractor')

// Memory storage so we get a buffer to pass directly to GridFS
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    // 200MB cap covers ZIPs; individual file check handled in route
    fileSize: 200 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint',
      'application/zip',
      'application/x-zip-compressed',
      'text/plain'
    ]
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error(
        'Invalid file type. Allowed: PDF, Word, PowerPoint, ZIP, TXT'
      ))
    }
  }
})

/**
 * @desc Check if a user has a specific TA permission for a course.
 * Returns true automatically for admins and instructors so callers
 * do not need to special-case those roles.
 * @param {string} userId - User ID to check
 * @param {string} role - User's role
 * @param {string} courseId - Course ID
 * @param {string} permission - Permission field name on TAPermission doc
 * @returns {Promise<boolean>}
 */
async function checkTAPermission(userId, role, courseId, permission) {
  if (['admin', 'instructor'].includes(role)) return true
  const perm = await TAPermission.findOne({ taUserId: userId, courseId })
  return perm ? perm[permission] === true : false
}

/**
 * @route POST /api/materials/upload
 * @desc  Upload a course material file to GridFS.
 *   Text extraction runs asynchronously after the response is sent
 *   so large files do not block the HTTP response.
 * @access Instructor, Admin, or TA with canAddResources permission
 */
router.post('/upload', protect, taOrAbove, upload.single('file'),
  async (req, res) => {
    try {
      const { courseId, title, description } = req.body

      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' })
      }
      if (!courseId) {
        return res.status(400).json({ message: 'courseId is required' })
      }
      if (!title) {
        return res.status(400).json({ message: 'title is required' })
      }

      // TAs need explicit permission to upload materials
      const hasPermission = await checkTAPermission(
        req.user.id, req.user.role, courseId, 'canAddResources'
      )
      if (!hasPermission) {
        return res.status(403).json({
          message: 'You do not have permission to upload materials'
        })
      }

      // Confirm the target course exists
      const course = await Course.findById(courseId)
      if (!course) {
        return res.status(404).json({ message: 'Course not found' })
      }

      // Derive file type from the original filename extension
      const ext = req.file.originalname.split('.').pop().toLowerCase()

      // Store file in GridFS and get back its ObjectId
      const gridfsId = await uploadToGridFS(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        { courseId, uploadedBy: req.user.id }
      )

      // Create the metadata document — text extraction runs later
      const material = await CourseMaterial.create({
        courseId,
        uploadedBy: req.user.id,
        title,
        description,
        fileName: req.file.originalname,
        fileType: ext,
        fileSize: req.file.size,
        gridfsId,
        isProcessed: false
      })

      // Register this material on the course document
      await Course.findByIdAndUpdate(
        courseId,
        { $addToSet: { materials: material._id } }
      )

      // Send response immediately — don't wait for text extraction
      res.status(201).json({
        message: 'File uploaded successfully. Text extraction in progress.',
        material: {
          _id:         material._id,
          title:       material.title,
          fileName:    material.fileName,
          fileType:    material.fileType,
          fileSize:    material.fileSize,
          isProcessed: false,
          uploadedAt:  material.uploadedAt
        }
      })

      // Extract text in background — buffer is still in memory here
      setImmediate(async () => {
        try {
          const text = await extractText(req.file.buffer, ext)
          await CourseMaterial.findByIdAndUpdate(material._id, {
            extractedText: text,
            isProcessed:   true
          })
          console.log(`Text extraction complete for: ${title}`)
        } catch (extractErr) {
          await CourseMaterial.findByIdAndUpdate(material._id, {
            processingError: extractErr.message,
            isProcessed:     true
          })
          console.error('Text extraction failed:', extractErr.message)
        }
      })

    } catch (err) {
      console.error('Material upload error:', err)
      res.status(500).json({ message: 'Upload failed' })
    }
  }
)

/**
 * @route GET /api/materials/course/:courseId
 * @desc  Get all active materials for a course.
 *   Returns metadata only — extractedText is excluded from list
 *   responses because it can be up to 100 000 characters long.
 * @access All authenticated users
 */
router.get('/course/:courseId', protect, async (req, res) => {
  try {
    const materials = await CourseMaterial
      .find({ courseId: req.params.courseId, isActive: true })
      .select('-extractedText')
      .populate('uploadedBy', 'fullName')
      .sort({ uploadedAt: -1 })
    res.status(200).json(materials)
  } catch (err) {
    console.error('Get materials error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

/**
 * @route GET /api/materials/:id/download
 * @desc  Download the original file from GridFS.
 *   Streams the file directly to the response — no full
 *   buffer held in memory.
 * @access All authenticated users
 */
router.get('/:id/download', protect, async (req, res) => {
  try {
    const material = await CourseMaterial.findById(req.params.id)
    if (!material || !material.isActive) {
      return res.status(404).json({ message: 'Material not found' })
    }
    res.set(
      'Content-Disposition',
      `attachment; filename="${material.fileName}"`
    )
    res.set('Content-Type', 'application/octet-stream')
    streamFromGridFS(material.gridfsId, res)
  } catch (err) {
    console.error('Download error:', err)
    res.status(500).json({ message: 'Download failed' })
  }
})

/**
 * @route GET /api/materials/:id
 * @desc  Get a single material record with full metadata.
 *   extractedText still excluded — only needed by the RAG engine.
 * @access All authenticated users
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const material = await CourseMaterial
      .findById(req.params.id)
      .select('-extractedText')
      .populate('uploadedBy', 'fullName email')
    if (!material || !material.isActive) {
      return res.status(404).json({ message: 'Material not found' })
    }
    res.status(200).json(material)
  } catch (err) {
    console.error('Get material error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

/**
 * @route DELETE /api/materials/:id
 * @desc  Soft delete a material (sets isActive false).
 *   GridFS file is kept for audit purposes.
 * @access Instructor, Admin, or TA with canDeleteResources permission
 */
router.delete('/:id', protect, taOrAbove, async (req, res) => {
  try {
    const material = await CourseMaterial.findById(req.params.id)
    if (!material || !material.isActive) {
      return res.status(404).json({ message: 'Material not found' })
    }

    // TAs need explicit canDeleteResources permission to remove materials
    // This is separate from canAddResources — upload and delete are independent
    const hasPermission = await checkTAPermission(
      req.user.id, req.user.role,
      material.courseId.toString(), 'canDeleteResources'
    )
    if (!hasPermission) {
      return res.status(403).json({
        message: 'You do not have permission to delete materials'
      })
    }

    await CourseMaterial.findByIdAndUpdate(req.params.id, {
      isActive: false
    })
    res.status(200).json({ message: 'Material removed successfully' })
  } catch (err) {
    console.error('Delete material error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
