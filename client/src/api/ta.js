/**
 * @desc API functions for TA permission management
 */
import axiosInstance from './axios'

/**
 * @desc Get all TA permission records for a course
 * @param {string} courseId - Course ID
 * @returns {Promise<Array>} Array of TAPermission objects
 */
export const getCoursePermissions = (courseId) =>
  axiosInstance.get(`/ta/permissions/${courseId}`)
    .then(r => r.data)

/**
 * @desc Upsert TA permissions for a course
 * @param {Object} data - { taUserId, courseId, canApproveEnrollments, ... }
 * @returns {Promise<Object>} Updated TAPermission object
 */
export const updateTAPermissions = (data) =>
  axiosInstance.put('/ta/permissions', data)
    .then(r => r.data)

/**
 * @desc Check the current user's permissions for a course.
 * Returns all-true for admin/instructor, DB record for TAs,
 * all-false if no record exists.
 * @param {string} courseId - Course ID
 * @returns {Promise<Object>} Permission flags object
 */
export const checkMyPermissions = (courseId) =>
  axiosInstance.get(`/ta/permissions/check/${courseId}`)
    .then(r => r.data)
