import api from './axios';

export const createProject = async (data) => {
  const response = await api.post('/projects', data);
  return response.data;
};

export const getUserProjects = async (userId) => {
  const response = await api.get(`/projects/user/${userId}`);
  return response.data;
};

export const getProject = async (id) => {
  const response = await api.get(`/projects/${id}`);
  return response.data;
};
