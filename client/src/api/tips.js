/**
 * @desc Tips API functions
 * All functions for CourseTip CRUD operations
 */
import axiosInstance from './axios'

/**
 * @desc Get all tips for a course
 * @param {string} courseId
 * @returns {Promise<Array>} array of tip objects
 */
export const getCourseTips = (courseId) =>
  axiosInstance.get(`/tips/course/${courseId}`).then(r => r.data)

/**
 * @desc Create a new tip
 * @param {Object} tipData - title, content, category, courseId, toolUrl (optional)
 * @returns {Promise<Object>} created tip
 */
export const createTip = (tipData) =>
  axiosInstance.post('/tips', tipData).then(r => r.data)

/**
 * @desc Update an existing tip
 * @param {string} tipId
 * @param {Object} updates
 * @returns {Promise<Object>} updated tip
 */
export const updateTip = (tipId, updates) =>
  axiosInstance.patch(`/tips/${tipId}`, updates).then(r => r.data)

/**
 * @desc Delete a tip (soft delete)
 * @param {string} tipId
 * @returns {Promise<Object>} success message
 */
export const deleteTip = (tipId) =>
  axiosInstance.delete(`/tips/${tipId}`).then(r => r.data)

/**
 * @desc Toggle student visibility for a tip
 * @param {string} tipId
 * @returns {Promise<Object>} updated visibility status
 */
export const toggleTipVisibility = (tipId) =>
  axiosInstance.patch(`/tips/${tipId}/visibility`).then(r => r.data)
