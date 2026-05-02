/**
 * @desc Submissions API functions
 */
import axiosInstance from './axios'

export const createSubmission = (data) =>
  axiosInstance.post('/submissions', data).then(r => r.data)

export const getMySubmissions = () =>
  axiosInstance.get('/submissions/my').then(r => r.data)

export const getCourseSubmissions = (courseId) =>
  axiosInstance.get(`/submissions/course/${courseId}`).then(r => r.data)

export const gradeSubmission = (id, data) =>
  axiosInstance.patch(`/submissions/${id}/grade`, data).then(r => r.data)
