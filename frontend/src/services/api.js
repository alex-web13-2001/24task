import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Создание axios инстанса
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor для добавления токена к запросам
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor для обработки ошибок и обновления токена
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Если ошибка 401 и это не повторный запрос
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_URL}/auth/refresh-token`, {
          refreshToken
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Если обновление токена не удалось, выходим из системы
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data)
};

// User API
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  uploadAvatar: (formData) => api.post('/users/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteAvatar: () => api.delete('/users/avatar'),
  changePassword: (data) => api.put('/users/change-password', data)
};

// Project API
export const projectAPI = {
  getAll: (params) => api.get('/projects', { params }),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  archive: (id) => api.post(`/projects/${id}/archive`),
  restore: (id) => api.post(`/projects/${id}/restore`),
  delete: (id) => api.delete(`/projects/${id}`),
  leave: (id) => api.post(`/projects/${id}/leave`),
  updateColumns: (id, columns) => api.put(`/projects/${id}/columns`, { columns })
};

// Task API
export const taskAPI = {
  getAll: (params) => api.get('/tasks', { params }),
  getArchived: () => api.get('/tasks/archived'),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  archive: (id) => api.post(`/tasks/${id}/archive`),
  restore: (id) => api.post(`/tasks/${id}/restore`),
  delete: (id) => api.delete(`/tasks/${id}`),
  reorder: (tasks) => api.post('/tasks/reorder', { tasks })
};

// Category API
export const categoryAPI = {
  getAll: (params) => api.get('/categories', { params }),
  getStats: () => api.get('/categories/stats'),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`)
};

// Invitation API
export const invitationAPI = {
  getByToken: (token) => api.get(`/invitations/token/${token}`),
  create: (data) => api.post('/invitations', data),
  accept: (token) => api.post('/invitations/accept', { token }),
  removeMember: (projectId, memberId) => 
    api.delete(`/invitations/projects/${projectId}/members/${memberId}`),
  updateMemberRole: (projectId, memberId, role) => 
    api.put(`/invitations/projects/${projectId}/members/${memberId}/role`, { role })
};

export default api;
