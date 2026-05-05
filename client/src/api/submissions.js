/**
 * @desc Submissions API functions
 */
import axiosInstance from './axios'

/**
 * @desc Create a new submission, optionally with a file attachment.
 * @param {Object} data - { projectId, title, description, deliverableUrl,
 *                          deliverableName, deliverableId }
 * @param {File|null} file - Optional file to upload with the submission
 * @returns {Promise<Object>} { message, submission }
 */
export const createSubmission = (data, file = null) => {
  const formData = new FormData()
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
      formData.append(key, data[key])
    }
  })
  if (file) formData.append('file', file)
  return axiosInstance.post('/submissions', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data)
}

export const getMySubmissions = () =>
  axiosInstance.get('/submissions/my').then(r => r.data)

export const getCourseSubmissions = (courseId) =>
  axiosInstance.get(`/submissions/course/${courseId}`).then(r => r.data)

export const gradeSubmission = (id, data) =>
  axiosInstance.patch(`/submissions/${id}/grade`, data).then(r => r.data)
