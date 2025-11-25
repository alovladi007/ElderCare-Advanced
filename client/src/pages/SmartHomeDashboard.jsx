import React, { useState, useEffect } from 'react';
import {
  Home, Lightbulb, Thermometer, Lock, Camera,
  DoorClosed, Settings, Power, Plus, Play,
  Clock, Zap, TrendingUp, Activity
} from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const SmartHomeDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [devices, setDevices] = useState([]);
  const [scenes, setScenes] = useState([]);
  const [automations, setAutomations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    fetchDevices();
    fetchScenes();
    fetchAutomations();
    fetchRooms();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${API_URL}/smarthome/dashboard`);
      const data = await response.json();
      if (data.success) {
        setDashboardData(data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const fetchDevices = async () => {
    try {
      const response = await fetch(`${API_URL}/smarthome/devices`);
      const data = await response.json();
      if (data.success) {
        setDevices(data.data);
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchScenes = async () => {
    try {
      const response = await fetch(`${API_URL}/smarthome/scenes`);
      const data = await response.json();
      if (data.success) {
        setScenes(data.data);
      }
    } catch (error) {
      console.error('Error fetching scenes:', error);
    }
  };

  const fetchAutomations = async () => {
    try {
      const response = await fetch(`${API_URL}/smarthome/automations`);
      const data = await response.json();
      if (data.success) {
        setAutomations(data.data);
      }
    } catch (error) {
      console.error('Error fetching automations:', error);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await fetch(`${API_URL}/smarthome/rooms`);
      const data = await response.json();
      if (data.success) {
        setRooms(data.data);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const toggleDevice = async (deviceId, currentState) => {
    try {
      const response = await fetch(`${API_URL}/smarthome/devices/${deviceId}/state`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ on: !currentState })
      });
      const data = await response.json();
      if (data.success) {
        setDevices(devices.map(d => d._id === deviceId ? data.data : d));
      }
    } catch (error) {
      console.error('Error toggling device:', error);
    }
  };

  const executeScene = async (sceneId) => {
    try {
      const response = await fetch(`${API_URL}/smarthome/scenes/${sceneId}/execute`, {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        fetchDevices(); // Refresh devices after scene execution
      }
    } catch (error) {
      console.error('Error executing scene:', error);
    }
  };

  const toggleAutomation = async (automationId) => {
    try {
      const response = await fetch(`${API_URL}/smarthome/automations/${automationId}/toggle`, {
        method: 'PATCH'
      });
      const data = await response.json();
      if (data.success) {
        setAutomations(automations.map(a => a._id === automationId ? data.data : a));
      }
    } catch (error) {
      console.error('Error toggling automation:', error);
    }
  };

  const getDeviceIcon = (type) => {
    switch (type) {
      case 'light': return <Lightbulb className="w-6 h-6" />;
      case 'thermostat': return <Thermometer className="w-6 h-6" />;
      case 'lock': return <Lock className="w-6 h-6" />;
      case 'camera': return <Camera className="w-6 h-6" />;
      case 'doorbell': return <DoorClosed className="w-6 h-6" />;
      default: return <Settings className="w-6 h-6" />;
    }
  };

  const filteredDevices = selectedRoom === 'all'
    ? devices
    : devices.filter(d => d.room?._id === selectedRoom);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading Smart Home Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Home className="w-10 h-10" />
            Smart Home Control Center
          </h1>
          <p className="text-blue-200">Manage your connected home devices, scenes, and automations</p>
        </div>

        {/* Quick Stats */}
        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm">Total Devices</p>
                  <p className="text-3xl font-bold text-white">{dashboardData.devices.total}</p>
                </div>
                <Settings className="w-12 h-12 text-blue-400" />
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-200 text-sm">Online</p>
                  <p className="text-3xl font-bold text-white">{dashboardData.devices.online}</p>
                </div>
                <Activity className="w-12 h-12 text-green-400" />
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-200 text-sm">Scenes</p>
                  <p className="text-3xl font-bold text-white">{dashboardData.scenes}</p>
                </div>
                <Play className="w-12 h-12 text-purple-400" />
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-200 text-sm">Active Automations</p>
                  <p className="text-3xl font-bold text-white">{dashboardData.automations.enabled}</p>
                </div>
                <Zap className="w-12 h-12 text-orange-400" />
              </div>
            </div>
          </div>
        )}

        {/* Quick Scene Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Play className="w-6 h-6" />
            Quick Scenes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {scenes.map((scene) => (
              <button
                key={scene._id}
                onClick={() => executeScene(scene._id)}
                className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-md rounded-xl p-6 border border-purple-400/30 hover:border-purple-400/60 transition-all transform hover:scale-105"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-purple-500/30 rounded-full flex items-center justify-center">
                    <Play className="w-8 h-8 text-purple-300" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-white">{scene.name}</h3>
                    <p className="text-sm text-purple-200">{scene.actions.length} actions</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Room Filter */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedRoom('all')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedRoom === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-white/10 text-blue-200 hover:bg-white/20'
            }`}
          >
            All Rooms
          </button>
          {rooms.map((room) => (
            <button
              key={room._id}
              onClick={() => setSelectedRoom(room._id)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedRoom === room._id
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/10 text-blue-200 hover:bg-white/20'
              }`}
            >
              {room.name}
            </button>
          ))}
        </div>

        {/* Devices Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Devices
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDevices.map((device) => (
              <div
                key={device._id}
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:border-white/40 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`${device.state.on ? 'text-yellow-400' : 'text-gray-400'}`}>
                      {getDeviceIcon(device.type)}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{device.name}</h3>
                      <p className="text-blue-200 text-sm">{device.room?.name || 'No Room'}</p>
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${device.online ? 'bg-green-400' : 'bg-red-400'}`} />
                </div>

                {device.capabilities.includes('on_off') && (
                  <button
                    onClick={() => toggleDevice(device._id, device.state.on)}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                      device.state.on
                        ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                        : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
                    }`}
                  >
                    <Power className="w-4 h-4 inline mr-2" />
                    {device.state.on ? 'Turn Off' : 'Turn On'}
                  </button>
                )}

                {device.type === 'thermostat' && (
                  <div className="mt-3 text-center">
                    <p className="text-2xl font-bold text-white">{device.state.temperature}°F</p>
                    <p className="text-sm text-blue-200">Target: {device.state.targetTemperature}°F</p>
                  </div>
                )}

                {device.type === 'lock' && (
                  <div className="mt-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      device.state.locked
                        ? 'bg-green-500/20 text-green-300'
                        : 'bg-red-500/20 text-red-300'
                    }`}>
                      {device.state.locked ? 'Locked' : 'Unlocked'}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Automations */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Zap className="w-6 h-6" />
            Automations
          </h2>
          <div className="space-y-4">
            {automations.map((automation) => (
              <div
                key={automation._id}
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="w-5 h-5 text-orange-400" />
                      <h3 className="text-lg font-semibold text-white">{automation.name}</h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-blue-200">
                      <span className="capitalize">{automation.type} trigger</span>
                      {automation.type === 'time' && (
                        <span>at {automation.trigger.time}</span>
                      )}
                      <span>{automation.actions.length} actions</span>
                      {automation.executionCount > 0 && (
                        <span>Executed {automation.executionCount} times</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleAutomation(automation._id)}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                      automation.enabled
                        ? 'bg-green-500 hover:bg-green-600 text-white'
                        : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
                    }`}
                  >
                    {automation.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartHomeDashboard;
