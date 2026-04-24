/**
 * @desc API functions for Enrollment operations
 */
import axiosInstance from './axios'

/**
 * @desc Request enrollment in a course
 * @param {string} courseId - Course to enroll in
 * @returns {Promise<Object>} New enrollment object
 */
export const requestEnrollment = (courseId) =>
  axiosInstance.post('/enrollments', { courseId }).then((r) => r.data)

/**
 * @desc Get current user's enrollments
 * @returns {Promise<Array>} Array of enrollment objects
 */
export const getMyEnrollments = () =>
  axiosInstance.get('/enrollments/me').then((r) => r.data)

/**
 * @desc Get all enrollments for a course
 * @param {string} courseId - Course ID
 * @returns {Promise<Array>} Array of enrollment objects
 */
export const getCourseEnrollments = (courseId) =>
  axiosInstance.get(`/enrollments/course/${courseId}`).then((r) => r.data)

/**
 * @desc Approve a pending enrollment
 * @param {string} enrollmentId - Enrollment ID
 * @returns {Promise<Object>} Updated enrollment
 */
export const approveEnrollment = (enrollmentId) =>
  axiosInstance.patch(`/enrollments/${enrollmentId}/approve`).then((r) => r.data)

/**
 * @desc Reject an enrollment request
 * @param {string} enrollmentId - Enrollment ID
 * @returns {Promise<Object>} Updated enrollment
 */
export const rejectEnrollment = (enrollmentId) =>
  axiosInstance.patch(`/enrollments/${enrollmentId}/reject`).then((r) => r.data)
