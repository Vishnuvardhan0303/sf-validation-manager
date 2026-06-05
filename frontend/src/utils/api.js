import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

export const authApi = {
  getAuthUrl: () => api.get('/auth/url'),
  exchangeToken: (code, state) => api.post('/auth/token', { code, state }),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const rulesApi = {
  getAll: () => api.get('/validation-rules'),
  toggle: (id, active) => api.patch(`/validation-rules/toggle/${id}`, { active }),
  bulkUpdate: (rules) => api.patch('/validation-rules', { rules }),
  deploy: (changes) => api.post('/validation-rules/deploy', { changes }),
};

export default api;