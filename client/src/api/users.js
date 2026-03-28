import api from './axios';

export const updateProfile = async (userId, data) => {
  const response = await api.put(`/users/${userId}`, data);
  return response.data;
};
