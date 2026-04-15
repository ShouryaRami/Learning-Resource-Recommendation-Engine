/**
 * @desc API functions for Course Material operations
 */
import axiosInstance from './axios'

/**
 * @desc Upload a course material file
 * @param {FormData} formData - File and metadata (courseId, title, description, file)
 * @returns {Promise<Object>} Created material object
 */
export const uploadMaterial = (formData) =>
  axiosInstance.post('/materials/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data)

/**
 * @desc Get all materials for a course
 * @param {string} courseId - Course ID
 * @returns {Promise<Array>} Array of material objects
 */
export const getCourseMaterials = (courseId) =>
  axiosInstance.get(`/materials/course/${courseId}`)
    .then(r => r.data)

/**
 * @desc Delete a course material (soft delete)
 * @param {string} materialId - Material ID
 * @returns {Promise<Object>} Success message
 */
export const deleteMaterial = (materialId) =>
  axiosInstance.delete(`/materials/${materialId}`)
    .then(r => r.data)

/**
 * @desc Download a material file with authentication.
 * Uses Axios to include the JWT token in the request,
 * then triggers a browser file download from the blob response.
 * @param {string} materialId - Material ID
 * @param {string} fileName   - Original file name for the download prompt
 */
export const downloadMaterial = async (materialId, fileName) => {
  const response = await axiosInstance.get(
    `/materials/${materialId}/download`,
    { responseType: 'blob' }
    // blob tells Axios to treat the response as binary file data
  )
  // Create a temporary object URL from the blob
  const url = window.URL.createObjectURL(new Blob([response.data]))
  // Create a hidden anchor and click it to trigger the file download
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', fileName || 'material')
  document.body.appendChild(link)
  link.click()
  // Clean up the temporary URL and anchor element
  link.parentNode.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * @desc Toggle student visibility for a material.
 *   Flips isVisibleToStudents on the server.
 * @param {string} materialId - Material ID
 * @returns {Promise<Object>} { message, isVisibleToStudents }
 */
export const toggleMaterialVisibility = (materialId) =>
  axiosInstance.patch(`/materials/${materialId}/visibility`)
    .then(r => r.data)
