import api from './axios';

export const getRecommendations = async (data) => {
  const response = await api.post('/recommendations', data);
  return response.data;
};
