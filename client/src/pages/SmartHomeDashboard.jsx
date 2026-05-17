import React, { useState, useEffect } from 'react';
import {
  Home, Lightbulb, Thermometer, Lock, Camera,
  DoorClosed, Settings, Power, Plus, Play,
  Clock, Zap, TrendingUp, Activity
} from 'lucide-react';
import { Container, Card, Badge, Button, Loading, Alert } from '../components';
import { smartHomeService } from '../services';

const SmartHomeDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [devices, setDevices] = useState([]);
  const [scenes, setScenes] = useState([]);
  const [automations, setAutomations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock homeId - in real app, get from auth context or route params
  const homeId = 'home-123';

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load data in parallel using our new services
      const [homeStatus, devicesData, rulesData] = await Promise.all([
        smartHomeService.getHomeStatus(homeId),
        smartHomeService.getDevices(homeId),
        smartHomeService.getRules(homeId)
      ]);

      setDashboardData(homeStatus);
      setDevices(devicesData);
      setAutomations(rulesData);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleDevice = async (deviceId, actuatorId) => {
    try {
      await smartHomeService.sendCommand(actuatorId, {
        commandName: 'TOGGLE',
        commandParamsJson: {}
      });
      // Refresh devices after toggle
      const updatedDevices = await smartHomeService.getDevices(homeId);
      setDevices(updatedDevices);
    } catch (error) {
      console.error('Error toggling device:', error);
      setError('Failed to control device');
    }
  };

  const executeScene = async (sceneId) => {
    try {
      // Execute scene logic here
      console.log('Executing scene:', sceneId);
      await loadDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error executing scene:', error);
    }
  };

  const toggleAutomation = async (ruleId) => {
    try {
      const rule = automations.find(a => a.id === ruleId);
      await smartHomeService.updateRule(ruleId, {
        isEnabled: !rule.isEnabled
      });
      // Refresh automations
      const updatedRules = await smartHomeService.getRules(homeId);
      setAutomations(updatedRules);
    } catch (error) {
      console.error('Error toggling automation:', error);
    }
  };

  const getDeviceIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'light': return Lightbulb;
      case 'thermostat': return Thermometer;
      case 'lock': return Lock;
      case 'camera': return Camera;
      case 'doorbell': return DoorClosed;
      default: return Settings;
    }
  };

  const getDeviceStatus = (device) => {
    if (device.status === 'ONLINE') {
      return { variant: 'success', text: 'Online' };
    } else if (device.status === 'OFFLINE') {
      return { variant: 'danger', text: 'Offline' };
    }
    return { variant: 'warning', text: 'Unknown' };
  };

  const filteredDevices = selectedRoom === 'all'
    ? devices
    : devices.filter(d => d.zoneId === selectedRoom);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <Loading variant="spinner" size="lg" fullScreen text="Loading Smart Home Dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-12">
      <Container size="xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Home className="w-10 h-10" />
            Smart Home Control Center
          </h1>
          <p className="text-blue-200">Manage your connected home devices, scenes, and automations</p>
        </div>

        {error && (
          <Alert
            type="error"
            dismissible
            onDismiss={() => setError(null)}
            className="mb-6"
          >
            {error}
          </Alert>
        )}

        {/* Quick Stats */}
        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card
              padding="normal"
              className="bg-white/10 backdrop-blur-md border-white/20"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm">Total Devices</p>
                  <p className="text-3xl font-bold text-white">{devices.length}</p>
                </div>
                <Settings className="w-12 h-12 text-blue-400" />
              </div>
            </Card>

            <Card
              padding="normal"
              className="bg-white/10 backdrop-blur-md border-white/20"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-200 text-sm">Online</p>
                  <p className="text-3xl font-bold text-white">
                    {devices.filter(d => d.status === 'ONLINE').length}
                  </p>
                </div>
                <Activity className="w-12 h-12 text-green-400" />
              </div>
            </Card>

            <Card
              padding="normal"
              className="bg-white/10 backdrop-blur-md border-white/20"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-200 text-sm">Scenes</p>
                  <p className="text-3xl font-bold text-white">{scenes.length}</p>
                </div>
                <Play className="w-12 h-12 text-purple-400" />
              </div>
            </Card>

            <Card
              padding="normal"
              className="bg-white/10 backdrop-blur-md border-white/20"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-200 text-sm">Automations</p>
                  <p className="text-3xl font-bold text-white">{automations.length}</p>
                </div>
                <Zap className="w-12 h-12 text-yellow-400" />
              </div>
            </Card>
          </div>
        )}

        {/* Room Filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <Button
            variant={selectedRoom === 'all' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSelectedRoom('all')}
            className={selectedRoom === 'all' ? '' : 'bg-white/10 text-white border-white/20'}
          >
            All Rooms
          </Button>
          {rooms.map((room) => (
            <Button
              key={room.id}
              variant={selectedRoom === room.id ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setSelectedRoom(room.id)}
              className={selectedRoom === room.id ? '' : 'bg-white/10 text-white border-white/20'}
            >
              {room.name}
            </Button>
          ))}
        </div>

        {/* Devices Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredDevices.map((device) => {
            const status = getDeviceStatus(device);
            const DeviceIcon = getDeviceIcon(device.deviceType?.name);

            return (
              <Card
                key={device.id}
                icon={DeviceIcon}
                title={device.name}
                badge={<Badge variant={status.variant}>{status.text}</Badge>}
                padding="normal"
                className="bg-white/10 backdrop-blur-md border-white/20"
                footer={
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Power}
                    onClick={() => toggleDevice(device.id, device.actuators?.[0]?.id)}
                    disabled={device.status !== 'ONLINE'}
                    className="w-full"
                  >
                    {device.status === 'ONLINE' ? 'Control' : 'Offline'}
                  </Button>
                }
              >
                <p className="text-gray-300 text-sm mb-2">{device.deviceType?.name}</p>
                <p className="text-gray-400 text-xs">
                  Zone: {device.zone?.name || 'Unassigned'}
                </p>
                {device.lastHeartbeat && (
                  <p className="text-gray-500 text-xs mt-1">
                    Last seen: {new Date(device.lastHeartbeat).toLocaleString()}
                  </p>
                )}
              </Card>
            );
          })}

          {filteredDevices.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No devices found</p>
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => console.log('Add device')}
                className="mt-4"
              >
                Add Device
              </Button>
            </div>
          )}
        </div>

        {/* Automations */}
        {automations.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-6 h-6" />
              Automation Rules
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {automations.map((automation) => (
                <Card
                  key={automation.id}
                  title={automation.name}
                  subtitle={automation.description}
                  badge={
                    <Badge variant={automation.isEnabled ? 'success' : 'default'}>
                      {automation.isEnabled ? 'Active' : 'Inactive'}
                    </Badge>
                  }
                  padding="normal"
                  className="bg-white/10 backdrop-blur-md border-white/20"
                  footer={
                    <Button
                      variant={automation.isEnabled ? 'danger' : 'success'}
                      size="sm"
                      onClick={() => toggleAutomation(automation.id)}
                      className="w-full"
                    >
                      {automation.isEnabled ? 'Disable' : 'Enable'}
                    </Button>
                  }
                >
                  <p className="text-gray-300 text-sm">
                    Trigger: {automation.triggerType}
                  </p>
                  {automation.severity && (
                    <Badge variant="warning" size="sm" className="mt-2">
                      {automation.severity}
                    </Badge>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Add Automation Button */}
        <div className="mt-8 text-center">
          <Button
            variant="primary"
            size="lg"
            icon={Plus}
            onClick={() => console.log('Add automation')}
          >
            Create New Automation
          </Button>
        </div>
      </Container>
    </div>
  );
};

export default SmartHomeDashboard;
