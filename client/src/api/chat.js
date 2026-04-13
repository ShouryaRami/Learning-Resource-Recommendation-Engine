/**
 * @desc API functions for AI chat operations
 */
import api from './axios'

/**
 * @desc Send a message to the RAG chat endpoint.
 * @param {string} message   - The student's question
 * @param {string} courseId  - Course ID for material context
 * @param {string} projectId - Optional project ID for extra context
 * @returns {Promise<{ reply, sources, hasMaterialContext }>}
 */
export const sendMessage = async (message, courseId, projectId = null) => {
  const response = await api.post('/chat', { message, courseId, projectId })
  return response.data
}

/**
 * @desc Get chat history for the current user in a course
 * @param {string} courseId - Course ID
 * @returns {Promise<Array>} Array of message objects
 */
export const getChatHistory = async (courseId) => {
  const response = await api.get(`/chat/history/${courseId}`)
  return response.data.messages
}
