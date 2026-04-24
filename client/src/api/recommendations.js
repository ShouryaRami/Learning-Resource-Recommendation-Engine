/**
 * @desc API functions for recommendation operations
 */
import api from './axios'

/**
 * @desc Generate a learning path for a student project.
 *   Returns course material excerpts, YouTube videos,
 *   GitHub repos, and a Gemini narrative.
 * @param {string} projectId - The project to generate recommendations for
 * @returns {Promise<{ courseMaterials, videos, codeExamples, learningPath, narrative }>}
 */
export const getRecommendations = async (projectId) => {
  const response = await api.post('/recommendations', { projectId })
  return response.data
}
