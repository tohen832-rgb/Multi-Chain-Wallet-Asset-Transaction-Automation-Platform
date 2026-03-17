import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Auto-attach token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401 && !err.config._retry) {
      err.config._retry = true;
      try {
        const refreshToken = sessionStorage.getItem('refreshToken');
        if (refreshToken) {
          const { data } = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
          sessionStorage.setItem('accessToken', data.accessToken);
          sessionStorage.setItem('refreshToken', data.refreshToken);
          err.config.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(err.config);
        }
      } catch {
        sessionStorage.clear();
        if (typeof window !== 'undefined') window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);
