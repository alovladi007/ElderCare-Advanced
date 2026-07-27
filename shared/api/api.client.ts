/**
 * Unified API Client with Authentication
 * Supports both React and Next.js applications
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { getAuthToken, clearAuthData } from '../auth/auth.service';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:24611';

/**
 * Create authenticated API client
 */
const createApiClient = (): AxiosInstance => {
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
    async (error: AxiosError) => {
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
  getUnifiedProfile: (elderId: string) =>
    apiClient.get(`/elder-profile/${elderId}/unified`),

  getDashboard: (elderId: string) =>
    apiClient.get(`/elder-profile/${elderId}/dashboard`),

  getHealthOverview: (elderId: string) =>
    apiClient.get(`/elder-profile/${elderId}/health`),

  getAllElders: () =>
    apiClient.get('/elder-profile'),
};

/**
 * Bookings API
 */
export const bookingsApi = {
  create: (data: {
    elderProfileId: string;
    serviceId: string;
    preferredDate: string;
    preferredTime: string;
    notes?: string;
  }) => apiClient.post('/bookings', data),

  getAll: (params?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }) => apiClient.get('/bookings', { params }),

  getById: (id: string) =>
    apiClient.get(`/bookings/${id}`),

  update: (id: string, data: {
    status?: string;
    notes?: string;
  }) => apiClient.patch(`/bookings/${id}`, data),

  getStats: () =>
    apiClient.get('/bookings/stats'),
};

/**
 * Smart Home API
 */
export const smartHomeApi = {
  getHome: (homeId: string) =>
    apiClient.get(`/smart-home/homes/${homeId}`),

  getDevices: (homeId: string) =>
    apiClient.get(`/smart-home/homes/${homeId}/devices`),

  controlDevice: (homeId: string, deviceId: string, data: {
    action: string;
    value?: any;
  }) => apiClient.post(`/smart-home/homes/${homeId}/devices/${deviceId}/control`, data),

  getAutomationRules: (homeId: string) =>
    apiClient.get(`/smart-home/homes/${homeId}/automation-rules`),

  createAutomationRule: (homeId: string, data: any) =>
    apiClient.post(`/smart-home/homes/${homeId}/automation-rules`, data),

  getAlerts: (homeId: string, params?: {
    status?: string;
    severity?: string;
  }) => apiClient.get(`/smart-home/homes/${homeId}/alerts`, { params }),

  acknowledgeAlert: (homeId: string, alertId: string) =>
    apiClient.post(`/smart-home/homes/${homeId}/alerts/${alertId}/acknowledge`),

  resolveAlert: (homeId: string, alertId: string) =>
    apiClient.post(`/smart-home/homes/${homeId}/alerts/${alertId}/resolve`),
};

/**
 * Health Monitoring API (proxied through API Gateway)
 */
export const healthMonitoringApi = {
  getVitals: (elderId: string, params?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }) => apiClient.get(`/health/vitals/${elderId}`, { params }),

  addVitalReading: (elderId: string, data: {
    heartRate?: number;
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    oxygenSaturation?: number;
    temperature?: number;
    respiratoryRate?: number;
    glucoseLevel?: number;
  }) => apiClient.post(`/health/vitals/${elderId}`, data),

  getHealthSummary: (elderId: string) =>
    apiClient.get(`/health/summary/${elderId}`),
};

/**
 * Care Management API
 */
export const careManagementApi = {
  getCarePlan: (elderId: string) =>
    apiClient.get(`/care-plans/elder/${elderId}`),

  createCarePlan: (elderId: string, data: {
    goals: string;
    interventions: string;
    frequency: string;
  }) => apiClient.post('/care-plans', { elderProfileId: elderId, ...data }),

  updateTask: (taskId: string, data: {
    status?: string;
    completedBy?: string;
    notes?: string;
  }) => apiClient.patch(`/care-tasks/${taskId}`, data),

  getMedications: (elderId: string) =>
    apiClient.get(`/medications/elder/${elderId}`),

  addMedication: (elderId: string, data: {
    name: string;
    dosage: string;
    frequency: string;
    startDate: string;
    endDate?: string;
    instructions?: string;
  }) => apiClient.post('/medications', { elderProfileId: elderId, ...data }),

  recordDose: (medicationId: string, data: {
    scheduledTime: string;
    actualTime: string;
    status: string;
    notes?: string;
  }) => apiClient.post(`/medications/${medicationId}/doses`, data),

  getAppointments: (elderId: string, params?: {
    upcoming?: boolean;
  }) => apiClient.get(`/appointments/elder/${elderId}`, { params }),

  createAppointment: (elderId: string, data: {
    title: string;
    type: string;
    startTime: string;
    endTime: string;
    location?: string;
    provider?: string;
    notes?: string;
  }) => apiClient.post('/appointments', { elderProfileId: elderId, ...data }),
};

/**
 * Generic API helper methods
 */
export const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig) =>
    apiClient.get<T>(url, config).then((res) => res.data),

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiClient.post<T>(url, data, config).then((res) => res.data),

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiClient.put<T>(url, data, config).then((res) => res.data),

  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiClient.patch<T>(url, data, config).then((res) => res.data),

  delete: <T = any>(url: string, config?: AxiosRequestConfig) =>
    apiClient.delete<T>(url, config).then((res) => res.data),
};

export default apiClient;
