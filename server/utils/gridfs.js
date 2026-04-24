/**
 * @desc GridFS utility for storing and retrieving files
 * in MongoDB. Used for course material uploads.
 * GridFS automatically chunks files and stores them
 * in fs.files and fs.chunks collections in MongoDB.
 */
const mongoose = require('mongoose')
const { GridFSBucket } = require('mongodb')

/**
 * @desc Get a GridFSBucket instance using the active
 * Mongoose connection. Must be called after DB connects.
 * @returns {GridFSBucket} Configured GridFS bucket
 */
function getBucket() {
  return new GridFSBucket(mongoose.connection.db, {
    bucketName: 'courseMaterials'
  })
}

/**
 * @desc Upload a file buffer to GridFS
 * @param {Buffer} buffer - File content as buffer
 * @param {string} filename - Original file name
 * @param {string} mimetype - File MIME type
 * @param {Object} metadata - Extra metadata to store
 * @returns {Promise<ObjectId>} GridFS file ID
 */
async function uploadToGridFS(buffer, filename, mimetype, metadata = {}) {
  return new Promise((resolve, reject) => {
    const bucket = getBucket()
    // Create upload stream to GridFS
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: mimetype,
      metadata
    })
    // Write buffer and end stream
    uploadStream.end(buffer)
    uploadStream.on('finish', () => {
      resolve(uploadStream.id)
    })
    uploadStream.on('error', reject)
  })
}

/**
 * @desc Download a file from GridFS as a buffer
 * @param {ObjectId|string} fileId - GridFS file ID
 * @returns {Promise<Buffer>} File content as buffer
 */
async function downloadFromGridFS(fileId) {
  return new Promise((resolve, reject) => {
    const bucket = getBucket()
    const chunks = []
    const downloadStream = bucket.openDownloadStream(
      new mongoose.Types.ObjectId(fileId)
    )
    downloadStream.on('data', chunk => chunks.push(chunk))
    downloadStream.on('end', () => {
      resolve(Buffer.concat(chunks))
    })
    downloadStream.on('error', reject)
  })
}

/**
 * @desc Stream a file from GridFS directly to HTTP response.
 * More memory efficient than downloading full buffer first.
 * @param {ObjectId|string} fileId - GridFS file ID
 * @param {Object} res - Express response object
 */
function streamFromGridFS(fileId, res) {
  const bucket = getBucket()
  const downloadStream = bucket.openDownloadStream(
    new mongoose.Types.ObjectId(fileId)
  )
  downloadStream.on('error', () => {
    res.status(404).json({ message: 'File not found' })
  })
  downloadStream.pipe(res)
}

/**
 * @desc Delete a file from GridFS by ID
 * @param {ObjectId|string} fileId - GridFS file ID
 * @returns {Promise<void>}
 */
async function deleteFromGridFS(fileId) {
  const bucket = getBucket()
  await bucket.delete(new mongoose.Types.ObjectId(fileId))
}

module.exports = {
  uploadToGridFS,
  downloadFromGridFS,
  streamFromGridFS,
  deleteFromGridFS
}
