import api from './axios';

export const getAnalytics = async () => {
  const response = await api.get('/admin/analytics');
  return response.data;
};
