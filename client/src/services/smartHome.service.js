import api from './api';

const smartHomeService = {
  // Homes
  getHomes: async (elderId) => {
    return await api.get(`/homes/elder/${elderId}`);
  },

  getHome: async (homeId) => {
    return await api.get(`/homes/${homeId}`);
  },

  getHomeStatus: async (homeId) => {
    return await api.get(`/homes/${homeId}/status`);
  },

  createHome: async (data) => {
    return await api.post('/homes', data);
  },

  updateHome: async (homeId, data) => {
    return await api.patch(`/homes/${homeId}`, data);
  },

  // Zones
  getZones: async (homeId) => {
    return await api.get(`/homes/${homeId}/zones`);
  },

  createZone: async (homeId, data) => {
    return await api.post(`/homes/${homeId}/zones`, data);
  },

  updateZone: async (zoneId, data) => {
    return await api.patch(`/homes/zones/${zoneId}`, data);
  },

  deleteZone: async (zoneId) => {
    return await api.delete(`/homes/zones/${zoneId}`);
  },

  // Devices
  getDevices: async (homeId) => {
    return await api.get(`/devices/home/${homeId}`);
  },

  getDevice: async (deviceId) => {
    return await api.get(`/devices/${deviceId}`);
  },

  registerDevice: async (data) => {
    return await api.post('/devices', data);
  },

  updateDevice: async (deviceId, data) => {
    return await api.patch(`/devices/${deviceId}`, data);
  },

  deleteDevice: async (deviceId) => {
    return await api.delete(`/devices/${deviceId}`);
  },

  // Actuator commands
  sendCommand: async (actuatorId, commandData) => {
    return await api.post(`/devices/actuators/${actuatorId}/command`, commandData);
  },

  getCommands: async (homeId) => {
    return await api.get(`/devices/home/${homeId}/commands`);
  },

  // Events
  getEvents: async (homeId, options = {}) => {
    const params = new URLSearchParams(options).toString();
    return await api.get(`/automation/events/home/${homeId}?${params}`);
  },

  getEventStats: async (homeId) => {
    return await api.get(`/automation/events/home/${homeId}/stats`);
  },

  // Automation rules
  getRules: async (homeId) => {
    return await api.get(`/automation/rules/home/${homeId}`);
  },

  createRule: async (data) => {
    return await api.post('/automation/rules', data);
  },

  updateRule: async (ruleId, data) => {
    return await api.patch(`/automation/rules/${ruleId}`, data);
  },

  deleteRule: async (ruleId) => {
    return await api.delete(`/automation/rules/${ruleId}`);
  },

  // Emergency scenarios
  getScenarios: async (homeId) => {
    return await api.get(`/emergency/scenarios/home/${homeId}`);
  },

  createScenario: async (data) => {
    return await api.post('/emergency/scenarios', data);
  },

  updateScenario: async (scenarioId, data) => {
    return await api.patch(`/emergency/scenarios/${scenarioId}`, data);
  },

  getActiveScenarios: async (homeId) => {
    return await api.get(`/emergency/active/home/${homeId}`);
  },

  cancelScenario: async (instanceId, cancelToken) => {
    return await api.post(`/emergency/cancel/${instanceId}`, { cancelToken });
  },

  // Help trigger
  triggerHelp: async (data) => {
    return await api.post('/emergency/help-trigger', data);
  },
};

export default smartHomeService;
