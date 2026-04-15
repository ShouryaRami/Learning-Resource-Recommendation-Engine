import api from './axios'

/**
 * @desc Get aggregate analytics counts for the admin dashboard
 * @returns {Promise<Object>} { totalStudents, totalProjects, totalSaved,
 *   totalCompleted, totalCourses, totalMaterials, pendingPitches }
 */
export const getAnalytics = async () => {
  const response = await api.get('/admin/analytics')
  return response.data
}

/**
 * @desc Get all users with optional role and search filters
 * @param {Object} params - { role?: string, search?: string }
 * @returns {Promise<Array>} Array of user objects (no passwords)
 */
export const getUsers = async (params = {}) => {
  const response = await api.get('/admin/users', { params })
  return response.data
}
