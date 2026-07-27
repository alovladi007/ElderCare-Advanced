import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:31611/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Smart Home API
export const smartHomeApi = {
  // Homes
  getHomeByElderId: (elderId: string) => api.get(`/homes/elder/${elderId}`),
  getHomeStatus: (homeId: string) => api.get(`/homes/${homeId}/status`),
  createZone: (homeId: string, data: any) => api.post(`/homes/${homeId}/zones`, data),
  getZones: (homeId: string) => api.get(`/homes/${homeId}/zones`),

  // Devices
  getDevices: (homeId: string) => api.get(`/devices/home/${homeId}`),
  createDevice: (data: any) => api.post(`/devices`, data),

  // Events
  getEvents: (homeId: string, params?: any) =>
    api.get(`/automation/events/home/${homeId}`, { params }),
  getEventStats: (homeId: string, days?: number) =>
    api.get(`/automation/events/home/${homeId}/stats`, { params: { days } }),

  // Automation Rules
  getRules: (homeId: string) => api.get(`/automation/rules/home/${homeId}`),
  createRule: (data: any) => api.post(`/automation/rules`, data),
  updateRule: (ruleId: string, data: any) => api.patch(`/automation/rules/${ruleId}`, data),
  deleteRule: (ruleId: string) => api.delete(`/automation/rules/${ruleId}`),

  // Emergency Scenarios
  getScenarios: (homeId: string) => api.get(`/emergency/scenarios/home/${homeId}`),
  createScenario: (data: any) => api.post(`/emergency/scenarios`, data),
  updateScenario: (scenarioId: string, data: any) =>
    api.patch(`/emergency/scenarios/${scenarioId}`, data),
  getActiveScenarios: (homeId: string) => api.get(`/emergency/active/home/${homeId}`),
  cancelScenario: (instanceId: string, cancelToken?: string) =>
    api.post(`/emergency/cancel/${instanceId}`, { cancelToken }),

  // Help Triggers
  createHelpTrigger: (data: any) => api.post(`/emergency/help-trigger`, data),

  // Simulator
  simulateFall: (homeId: string) => api.post(`/sim/smart-home/fall/${homeId}`),
  simulateSmoke: (homeId: string) => api.post(`/sim/smart-home/smoke/${homeId}`),
  simulateGasLeak: (homeId: string) => api.post(`/sim/smart-home/gas-leak/${homeId}`),
  simulateWaterLeak: (homeId: string) => api.post(`/sim/smart-home/water-leak/${homeId}`),
  simulateMotionPattern: (homeId: string, duration?: number) =>
    api.post(`/sim/smart-home/motion-pattern/${homeId}`, {}, { params: { duration } }),
};
