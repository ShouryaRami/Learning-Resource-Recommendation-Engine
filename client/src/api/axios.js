import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('umbc_token');
    if (token) {
      config.headers.Authorization = 'Bearer ' + token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  response => response,
  async error => {
    const config = error.config

    // Auto logout on 401 — redirect to login unless already on an auth page
    if (error.response?.status === 401) {
      const authPaths = ['/login', '/register', '/verify-otp',
        '/forgot-password', '/reset-password', '/set-password']
      const isAuthPage = authPaths.some(p =>
        window.location.pathname.startsWith(p))
      if (!isAuthPage) {
        localStorage.removeItem('umbc_token')
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }

    // Retry up to 3 times on 5xx errors with progressive delay
    if (error.response?.status >= 500) {
      config._retryCount = config._retryCount || 0
      if (config._retryCount < 3) {
        config._retryCount++
        const delay = config._retryCount * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
        return api(config)
      }
    }

    return Promise.reject(error)
  }
)

export default api;
