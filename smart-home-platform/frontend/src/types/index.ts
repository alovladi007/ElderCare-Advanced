export type HomeMode = 'HOME' | 'AWAY' | 'SLEEP' | 'VACATION';

export type DeviceType = 'light' | 'thermostat' | 'lock' | 'sensor' | 'camera' | 'switch';

export interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

export interface Home {
  id: string;
  name: string;
  mode: HomeMode;
  owner_id: string;
  created_at: string;
}

export interface HomeSummary {
  homeId: string;
  mode: HomeMode;
  allSecure: boolean;
  outsideTemperature?: number;
  outsideWeather?: string;
  totalDevices: number;
  devicesOn: number;
  alertsCount: number;
}

export interface Room {
  id: string;
  name: string;
  home_id: string;
  icon?: string;
  created_at: string;
  devices?: Device[];
  deviceCount?: number;
  devicesOn?: number;
  temperature?: number;
}

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  room_id: string;
  hub_device_id?: string;
  online: boolean;
  state: Record<string, any>;
  capabilities?: string[];
  created_at: string;
}

export interface Scene {
  id: string;
  name: string;
  home_id: string;
  icon?: string;
  is_favorite: boolean;
  created_at: string;
  devices?: SceneDeviceState[];
}

export interface SceneDeviceState {
  id: string;
  scene_id: string;
  device_id: string;
  target_state: Record<string, any>;
  device?: Device;
}

export interface Automation {
  id: string;
  name: string;
  home_id: string;
  enabled: boolean;
  triggers: AutomationTrigger[];
  conditions?: AutomationCondition[];
  actions: AutomationAction[];
  last_fired?: string;
  created_at: string;
}

export interface AutomationTrigger {
  id: string;
  automation_id: string;
  trigger_type: 'time' | 'device_state' | 'home_mode' | 'scene_activated';
  config: Record<string, any>;
}

export interface AutomationCondition {
  id: string;
  automation_id: string;
  condition_type: 'time_range' | 'home_mode' | 'device_state';
  config: Record<string, any>;
}

export interface AutomationAction {
  id: string;
  automation_id: string;
  action_type: 'device_command' | 'scene_activate' | 'home_mode_change' | 'notification';
  config: Record<string, any>;
}

export interface Event {
  id: string;
  home_id: string;
  event_type: 'device_command' | 'scene_activated' | 'automation_fired' | 'mode_changed' | 'device_state_changed';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface Alert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  status: 'open' | 'acknowledged' | 'resolved';
  created_at: string;
  resolved_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface WebSocketMessage {
  type: 'device_state_changed' | 'alert_created' | 'automation_fired' | 'scene_activated';
  data: any;
}
