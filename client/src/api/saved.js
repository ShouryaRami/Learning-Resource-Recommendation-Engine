import api from './axios';

export const saveResource = async (resourceId, projectId) => {
  const response = await api.post('/saved', { resourceId, projectId });
  return response.data;
};

export const getSavedResources = async () => {
  const response = await api.get('/saved');
  return response.data;
};

export const removeSaved = async (savedId) => {
  const response = await api.delete(`/saved/${savedId}`);
  return response.data;
};

export const markComplete = async (savedId) => {
  const response = await api.patch(`/saved/${savedId}/complete`);
  return response.data;
};
