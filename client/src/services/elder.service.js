import api from './api';

const elderService = {
  // Get all elder profiles
  getAll: async () => {
    return await api.get('/elder-profile');
  },

  // Get elder by ID
  getById: async (elderId) => {
    return await api.get(`/elder-profile/${elderId}`);
  },

  // Get elder dashboard
  getDashboard: async (elderId) => {
    return await api.get(`/elder-profile/${elderId}/dashboard`);
  },

  // Get elder health summary
  getHealthSummary: async (elderId) => {
    return await api.get(`/elder-profile/${elderId}/health`);
  },

  // Create elder profile
  create: async (data) => {
    return await api.post('/elder-profile', data);
  },

  // Update elder profile
  update: async (elderId, data) => {
    return await api.patch(`/elder-profile/${elderId}`, data);
  },
};

export default elderService;
