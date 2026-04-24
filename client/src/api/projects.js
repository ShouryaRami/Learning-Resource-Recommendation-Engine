/**
 * @desc API functions for Project operations
 */
import api from './axios'

/**
 * @desc Submit a project pitch (student)
 * @param {FormData} formData - Project fields + optional proposal file
 * @returns {Promise<Object>} Created project
 */
export const pitchProject = (formData) =>
  api.post('/projects/pitch', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data)

/**
 * @desc Assign a project directly to a student (instructor)
 * @param {Object} data - Project data including studentId
 * @returns {Promise<Object>} Created project
 */
export const assignProject = (data) =>
  api.post('/projects/assign', data).then(r => r.data)

/**
 * @desc Approve a pending project pitch
 * @param {string} projectId - Project ID to approve
 * @returns {Promise<Object>} Updated project
 */
export const approveProject = (projectId) =>
  api.patch(`/projects/${projectId}/approve`).then(r => r.data)

/**
 * @desc Reject a project pitch with feedback
 * @param {string} projectId - Project ID to reject
 * @param {string} feedback - Rejection feedback message
 * @returns {Promise<Object>} Updated project
 */
export const rejectProject = (projectId, feedback) =>
  api.patch(`/projects/${projectId}/reject`, { feedback }).then(r => r.data)

/**
 * @desc Get all projects belonging to the current user
 * @returns {Promise<Array>} Array of project objects
 */
export const getMyProjects = () =>
  api.get('/projects/mine').then(r => r.data)

/**
 * @desc Get all projects in a course
 * @param {string} courseId - Course ID
 * @returns {Promise<Array>} Array of project objects
 */
export const getCourseProjects = (courseId) =>
  api.get(`/projects/course/${courseId}`).then(r => r.data)

/**
 * @desc Get all pitch_pending projects for a course
 * @param {string} courseId - Course ID
 * @returns {Promise<Array>} Pending project array
 */
export const getPendingProjects = (courseId) =>
  api.get(`/projects/pending/${courseId}`).then(r => r.data)

/**
 * @desc Get a single project by ID
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} Project object
 */
export const getProject = (projectId) =>
  api.get(`/projects/${projectId}`).then(r => r.data)

/**
 * @desc Delete a project
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} Success message
 */
export const deleteProject = (projectId) =>
  api.delete(`/projects/${projectId}`).then(r => r.data)
