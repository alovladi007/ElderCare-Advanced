import apiClient from './apiClient';
import type {
  User,
  Home,
  HomeSummary,
  Room,
  Device,
  Scene,
  Automation,
  Event,
  Alert,
  AuthResponse,
  SceneDeviceState,
} from '@/types';

// Auth API
export const authAPI = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    const response = await apiClient.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data;
  },

  register: async (email: string, password: string, full_name: string): Promise<User> => {
    const response = await apiClient.post('/auth/register', { email, password, full_name });
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
};

// Homes API
export const homesAPI = {
  list: async (): Promise<Home[]> => {
    const response = await apiClient.get('/homes');
    return response.data;
  },

  get: async (homeId: string): Promise<Home> => {
    const response = await apiClient.get(`/homes/${homeId}`);
    return response.data;
  },

  getSummary: async (homeId: string): Promise<HomeSummary> => {
    const response = await apiClient.get(`/homes/${homeId}/summary`);
    return response.data;
  },

  updateMode: async (homeId: string, mode: string): Promise<Home> => {
    const response = await apiClient.patch(`/homes/${homeId}/mode`, { mode });
    return response.data;
  },
};

// Rooms API
export const roomsAPI = {
  list: async (homeId?: string): Promise<Room[]> => {
    const response = await apiClient.get('/rooms', { params: { home_id: homeId } });
    return response.data;
  },

  get: async (roomId: string): Promise<Room> => {
    const response = await apiClient.get(`/rooms/${roomId}`);
    return response.data;
  },
};

// Devices API
export const devicesAPI = {
  list: async (roomId?: string): Promise<Device[]> => {
    const response = await apiClient.get('/devices', { params: { room_id: roomId } });
    return response.data;
  },

  get: async (deviceId: string): Promise<Device> => {
    const response = await apiClient.get(`/devices/${deviceId}`);
    return response.data;
  },

  updateState: async (deviceId: string, state: Record<string, any>): Promise<Device> => {
    const response = await apiClient.patch(`/devices/${deviceId}/state`, state);
    return response.data;
  },

  sendCommand: async (deviceId: string, command: Record<string, any>): Promise<void> => {
    await apiClient.post(`/devices/${deviceId}/command`, { command });
  },
};

// Scenes API
export const scenesAPI = {
  list: async (homeId?: string): Promise<Scene[]> => {
    const response = await apiClient.get('/scenes', { params: { home_id: homeId } });
    return response.data;
  },

  get: async (sceneId: string): Promise<Scene> => {
    const response = await apiClient.get(`/scenes/${sceneId}`);
    return response.data;
  },

  activate: async (sceneId: string): Promise<void> => {
    await apiClient.post(`/scenes/${sceneId}/activate`);
  },

  create: async (data: Partial<Scene>): Promise<Scene> => {
    const response = await apiClient.post('/scenes', data);
    return response.data;
  },

  update: async (sceneId: string, data: Partial<Scene>): Promise<Scene> => {
    const response = await apiClient.put(`/scenes/${sceneId}`, data);
    return response.data;
  },
};

// Automations API
export const automationsAPI = {
  list: async (homeId?: string): Promise<Automation[]> => {
    const response = await apiClient.get('/automations', { params: { home_id: homeId } });
    return response.data;
  },

  get: async (automationId: string): Promise<Automation> => {
    const response = await apiClient.get(`/automations/${automationId}`);
    return response.data;
  },

  toggle: async (automationId: string): Promise<Automation> => {
    const response = await apiClient.patch(`/automations/${automationId}/toggle`);
    return response.data;
  },

  create: async (data: Partial<Automation>): Promise<Automation> => {
    const response = await apiClient.post('/automations', data);
    return response.data;
  },
};

// Events API
export const eventsAPI = {
  list: async (limit = 50, offset = 0): Promise<Event[]> => {
    const response = await apiClient.get('/events', { params: { limit, offset } });
    return response.data;
  },
};

// Alerts API
export const alertsAPI = {
  list: async (status?: string): Promise<Alert[]> => {
    const response = await apiClient.get('/alerts', { params: { status } });
    return response.data;
  },
};
