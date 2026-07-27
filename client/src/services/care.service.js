import api from './api';

const careService = {
  // Medications
  getMedications: async (elderId) => {
    return await api.get(`/care/medications?elderId=${elderId}`);
  },

  getMedicationById: async (medicationId) => {
    return await api.get(`/care/medications/${medicationId}`);
  },

  createMedication: async (data) => {
    return await api.post('/care-management/medications', data);
  },

  updateMedication: async (medicationId, data) => {
    return await api.patch(`/care/medications/${medicationId}`, data);
  },

  deleteMedication: async (medicationId) => {
    return await api.delete(`/care/medications/${medicationId}`);
  },

  recordDose: async (doseId, data) => {
    return await api.patch(`/care/medications/doses/${doseId}`, data);
  },

  getUpcomingDoses: async (elderId) => {
    return await api.get(`/care/medications/upcoming-doses?elderId=${elderId}`);
  },

  // Appointments
  getAppointments: async (elderId) => {
    return await api.get(`/care/appointments?elderId=${elderId}`);
  },

  getAppointmentById: async (appointmentId) => {
    return await api.get(`/care/appointments/${appointmentId}`);
  },

  createAppointment: async (data) => {
    return await api.post('/care-management/appointments', data);
  },

  updateAppointment: async (appointmentId, data) => {
    return await api.patch(`/care/appointments/${appointmentId}`, data);
  },

  deleteAppointment: async (appointmentId) => {
    return await api.delete(`/care/appointments/${appointmentId}`);
  },

  getUpcomingAppointments: async (elderId) => {
    return await api.get(`/care/appointments/upcoming?elderId=${elderId}`);
  },

  // Care Plans
  getCarePlan: async (elderId) => {
    return await api.get(`/care/care-plans?elderId=${elderId}`);
  },

  createCarePlan: async (data) => {
    return await api.post('/care-management/care-plans', data);
  },

  updateCarePlan: async (carePlanId, data) => {
    return await api.patch(`/care/care-plans/${carePlanId}`, data);
  },

  // Care Tasks
  getCareTasks: async (carePlanId) => {
    return await api.get(`/care/care-plans/${carePlanId}/tasks`);
  },

  createCareTask: async (carePlanId, data) => {
    return await api.post(`/care/care-plans/${carePlanId}/tasks`, data);
  },

  updateCareTask: async (taskId, data) => {
    return await api.patch(`/care/tasks/${taskId}`, data);
  },

  deleteCareTask: async (taskId) => {
    return await api.delete(`/care/tasks/${taskId}`);
  },

  // Vital Signs
  getVitalReadings: async (elderId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return await api.get(`/care/health-monitoring/vitals?elderId=${elderId}&${query}`);
  },

  recordVital: async (data) => {
    return await api.post('/care-management/health/vitals', data);
  },

  getVitalStats: async (elderId, vitalType) => {
    return await api.get(`/care/health-monitoring/vitals/stats?elderId=${elderId}&type=${vitalType}`);
  },

  // Health Summary
  getHealthSummary: async (elderId) => {
    return await api.get(`/care/health-monitoring/summary?elderId=${elderId}`);
  },
};

export default careService;
