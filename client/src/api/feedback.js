import api from './axios';

export const submitFeedback = async (resourceId, rating, comment, projectId) => {
  const response = await api.post('/feedback', { resourceId, rating, comment, projectId });
  return response.data;
};
