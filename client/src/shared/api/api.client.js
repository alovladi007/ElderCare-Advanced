/**
 * Unified API Client with Authentication
 * JavaScript version for React components
 */

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:24611/api';

/**
 * Get auth token from localStorage
 */
const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('eldercare_token') || localStorage.getItem('auth_token');
};

/**
 * Clear auth data
 */
const clearAuthData = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('eldercare_token');
  localStorage.removeItem('eldercare_user');
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
};

/**
 * Create authenticated API client
 */
const createApiClient = () => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  // Request interceptor - add auth token
  client.interceptors.request.use(
    (config) => {
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor - handle errors
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      // Handle 401 Unauthorized
      if (error.response?.status === 401) {
        clearAuthData();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
};

// Export singleton instance
export const apiClient = createApiClient();

/**
 * Elder Profile API
 */
export const elderProfileApi = {
  getUnifiedProfile: (elderId) =>
    apiClient.get(`/elder-profile/${elderId}/unified`),

  getDashboard: (elderId) =>
    apiClient.get(`/elder-profile/${elderId}/dashboard`),

  getHealthOverview: (elderId) =>
    apiClient.get(`/elder-profile/${elderId}/health`),

  getAllElders: () =>
    apiClient.get('/elder-profile'),
};

/**
 * Bookings API
 */
export const bookingsApi = {
  create: (data) => apiClient.post('/bookings', data),

  getAll: (params) => apiClient.get('/bookings', { params }),

  getById: (id) => apiClient.get(`/bookings/${id}`),

  update: (id, data) => apiClient.patch(`/bookings/${id}`, data),

  getStats: () => apiClient.get('/bookings/stats'),
};

/**
 * Smart Home API
 */
export const smartHomeApi = {
  getHome: (homeId) =>
    apiClient.get(`/homes/${homeId}`),

  getHomeStatus: (homeId) =>
    apiClient.get(`/homes/${homeId}/status`),

  getDevices: (homeId) =>
    apiClient.get(`/devices/home/${homeId}`),

  controlDevice: (deviceId, data) =>
    apiClient.post(`/devices/actuators/${deviceId}/command`, data),

  getAutomationRules: (homeId) =>
    apiClient.get(`/automation/rules/home/${homeId}`),

  createAutomationRule: (data) =>
    apiClient.post('/automation/rules', data),

  updateAutomationRule: (ruleId, data) =>
    apiClient.patch(`/automation/rules/${ruleId}`, data),

  deleteAutomationRule: (ruleId) =>
    apiClient.delete(`/automation/rules/${ruleId}`),

  getAlerts: (homeId, params) =>
    apiClient.get(`/automation/events/home/${homeId}`, { params }),

  getEmergencyScenarios: (homeId) =>
    apiClient.get(`/emergency/scenarios/home/${homeId}`),

  createEmergencyScenario: (data) =>
    apiClient.post('/emergency/scenarios', data),

  updateEmergencyScenario: (scenarioId, data) =>
    apiClient.patch(`/emergency/scenarios/${scenarioId}`, data),

  getActiveEmergencies: (homeId) =>
    apiClient.get(`/emergency/active/home/${homeId}`),

  cancelEmergency: (instanceId) =>
    apiClient.post(`/emergency/cancel/${instanceId}`),
};

/**
 * Health Monitoring API
 */
export const healthMonitoringApi = {
  getVitals: (elderId, params) =>
    apiClient.get(`/care-management/health/vitals/${elderId}`, { params }),

  addVitalReading: (data) =>
    apiClient.post('/care-management/health/vitals', data),

  getHealthSummary: (elderId) =>
    apiClient.get(`/care-management/health/summary/${elderId}`),

  deleteVital: (vitalId) =>
    apiClient.delete(`/care-management/health/vitals/${vitalId}`),
};

/**
 * Care Management API
 */
export const careManagementApi = {
  getCarePlan: (elderId) =>
    apiClient.get(`/care-management/care-plans/elder/${elderId}`),

  createCarePlan: (data) =>
    apiClient.post('/care-management/care-plans', data),

  updateTask: (taskId, data) =>
    apiClient.patch(`/care-management/care-tasks/${taskId}`, data),

  getMedications: (elderId) =>
    apiClient.get(`/care-management/medications/elder/${elderId}`),

  addMedication: (data) =>
    apiClient.post('/care-management/medications', data),

  recordDose: (medicationId, data) =>
    apiClient.post(`/care-management/medications/${medicationId}/doses`, data),

  getAppointments: (elderId, params) =>
    apiClient.get(`/care-management/appointments/elder/${elderId}`, { params }),

  createAppointment: (data) =>
    apiClient.post('/care-management/appointments', data),
};

/**
 * Generic API helper methods
 */
export const api = {
  get: (url, config) =>
    apiClient.get(url, config).then((res) => res.data),

  post: (url, data, config) =>
    apiClient.post(url, data, config).then((res) => res.data),

  put: (url, data, config) =>
    apiClient.put(url, data, config).then((res) => res.data),

  patch: (url, data, config) =>
    apiClient.patch(url, data, config).then((res) => res.data),

  delete: (url, config) =>
    apiClient.delete(url, config).then((res) => res.data),
};

export default apiClient;
