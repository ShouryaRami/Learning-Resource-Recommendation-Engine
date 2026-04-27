/**
 * @desc API functions for Course operations
 */
import axiosInstance from './axios'

/**
 * @desc Get all active courses
 * @returns {Promise<Array>} Array of course objects
 */
export const getAllCourses = () =>
  axiosInstance.get('/courses').then((r) => r.data)

/**
 * @desc Get a single course by ID
 * @param {string} id - Course ID
 * @returns {Promise<Object>} Course object
 */
export const getCourse = (id) =>
  axiosInstance.get(`/courses/${id}`).then((r) => r.data)

/**
 * @desc Get enrolled students for a course
 * @param {string} id - Course ID
 * @returns {Promise<Array>} Array of enrollment objects
 */
export const getCourseStudents = (id) =>
  axiosInstance.get(`/courses/${id}/students`).then((r) => r.data)

/**
 * @desc Assign a faculty member to a course
 * @param {string} courseId - Course ID
 * @param {string} userId - Faculty user ID
 * @returns {Promise<Object>} Updated course
 */
export const assignFaculty = (courseId, userId) =>
  axiosInstance.post(`/courses/${courseId}/assign-faculty`, { userId }).then((r) => r.data)

/**
 * @desc Assign a TA to a course
 * @param {string} courseId - Course ID
 * @param {string} userId - TA user ID
 * @returns {Promise<Object>} Updated course
 */
export const assignTA = (courseId, userId) =>
  axiosInstance.post(`/courses/${courseId}/assign-ta`, { userId }).then((r) => r.data)

/**
 * @desc Create a new course
 * @param {Object} courseData - title, code, department, semester, etc.
 * @returns {Promise<Object>} Created course
 */
export const createCourse = (courseData) =>
  axiosInstance.post('/courses', courseData).then((r) => r.data)
