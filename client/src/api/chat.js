import api from './axios';

export const sendMessage = async (messages, projectContext) => {
  const response = await api.post('/chat', { messages, projectContext });
  return response.data.reply;
};
