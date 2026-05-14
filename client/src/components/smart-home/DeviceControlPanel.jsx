import React, { useState, useEffect } from 'react';
import {
  Power, Plus, Filter, Search, Lightbulb, Thermometer,
  Lock, Camera, DoorClosed, Settings as SettingsIcon
} from 'lucide-react';
import { Card, Badge, Button, Loading, Alert, Input, Select, Modal } from '../..';
import { smartHomeService } from '../../../services';

const DeviceControlPanel = ({ homeId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDevice, setShowAddDevice] = useState(false);

  useEffect(() => {
    loadDevices();
    loadZones();
  }, [homeId]);

  const loadDevices = async () => {
    try {
      setLoading(true);
      const data = await smartHomeService.getDevices(homeId);
      setDevices(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  const loadZones = async () => {
    try {
      const data = await smartHomeService.getZones(homeId);
      setZones(data);
    } catch (err) {
      console.error('Failed to load zones:', err);
    }
  };

  const toggleDevice = async (deviceId, actuatorId) => {
    try {
      await smartHomeService.sendCommand(actuatorId, {
        commandName: 'TOGGLE',
        commandParamsJson: {}
      });
      await loadDevices(); // Refresh
    } catch (err) {
      setError(`Failed to control device: ${err.message}`);
    }
  };

  const getDeviceIcon = (deviceType) => {
    const iconMap = {
      light: Lightbulb,
      thermostat: Thermometer,
      lock: Lock,
      camera: Camera,
      doorbell: DoorClosed,
    };
    return iconMap[deviceType?.toLowerCase()] || SettingsIcon;
  };

  const getStatusBadge = (status) => {
    const variants = {
      ONLINE: { variant: 'success', text: 'Online' },
      OFFLINE: { variant: 'danger', text: 'Offline' },
      ERROR: { variant: 'warning', text: 'Error' },
    };
    return variants[status] || { variant: 'default', text: 'Unknown' };
  };

  const filteredDevices = devices.filter((device) => {
    const matchesZone = selectedZone === 'all' || device.zoneId === selectedZone;
    const matchesSearch =
      searchQuery === '' ||
      device.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesZone && matchesSearch;
  });

  if (loading) {
    return <Loading variant="spinner" size="lg" text="Loading devices..." />;
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert type="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Controls Bar */}
      <Card padding="normal" className="bg-white/10 backdrop-blur-md border-white/20">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex-1 w-full md:w-auto">
            <Input
              placeholder="Search devices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={Search}
              inputClassName="bg-white/10 border-white/20 text-white placeholder-gray-400"
              className="mb-0"
            />
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <Select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              options={[
                { value: 'all', label: 'All Zones' },
                ...zones.map((zone) => ({ value: zone.id, label: zone.name })),
              ]}
              className="mb-0 flex-1 md:flex-none md:w-48"
            />

            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setShowAddDevice(true)}
            >
              Add Device
            </Button>
          </div>
        </div>
      </Card>

      {/* Device Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="sm" className="bg-white/10 backdrop-blur-md border-white/20">
          <p className="text-gray-300 text-sm">Total</p>
          <p className="text-2xl font-bold text-white">{devices.length}</p>
        </Card>
        <Card padding="sm" className="bg-green-500/20 border-green-500/50">
          <p className="text-green-200 text-sm">Online</p>
          <p className="text-2xl font-bold text-white">
            {devices.filter((d) => d.status === 'ONLINE').length}
          </p>
        </Card>
        <Card padding="sm" className="bg-red-500/20 border-red-500/50">
          <p className="text-red-200 text-sm">Offline</p>
          <p className="text-2xl font-bold text-white">
            {devices.filter((d) => d.status === 'OFFLINE').length}
          </p>
        </Card>
        <Card padding="sm" className="bg-blue-500/20 border-blue-500/50">
          <p className="text-blue-200 text-sm">Zones</p>
          <p className="text-2xl font-bold text-white">{zones.length}</p>
        </Card>
      </div>

      {/* Devices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDevices.map((device) => {
          const DeviceIcon = getDeviceIcon(device.deviceType?.name);
          const statusBadge = getStatusBadge(device.status);

          return (
            <Card
              key={device.id}
              padding="normal"
              className="bg-white/10 backdrop-blur-md border-white/20"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-500/20 rounded-lg">
                    <DeviceIcon className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{device.name}</h3>
                    <p className="text-gray-400 text-sm">
                      {device.deviceType?.name}
                    </p>
                  </div>
                </div>
                <Badge variant={statusBadge.variant}>{statusBadge.text}</Badge>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Zone:</span>
                  <span className="text-white">{device.zone?.name || 'Unassigned'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Sensors:</span>
                  <span className="text-white">{device.sensors?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Actuators:</span>
                  <span className="text-white">{device.actuators?.length || 0}</span>
                </div>
                {device.lastHeartbeat && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Last seen:</span>
                    <span className="text-gray-500 text-xs">
                      {new Date(device.lastHeartbeat).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  icon={Power}
                  onClick={() =>
                    toggleDevice(device.id, device.actuators?.[0]?.id)
                  }
                  disabled={device.status !== 'ONLINE'}
                  className="flex-1"
                >
                  Control
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={SettingsIcon}
                  className="bg-white/5 text-white hover:bg-white/10"
                >
                  Settings
                </Button>
              </div>
            </Card>
          );
        })}

        {filteredDevices.length === 0 && (
          <div className="col-span-full text-center py-12">
            <SettingsIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-4">
              {searchQuery || selectedZone !== 'all'
                ? 'No devices match your filters'
                : 'No devices registered yet'}
            </p>
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setShowAddDevice(true)}
            >
              Add Your First Device
            </Button>
          </div>
        )}
      </div>

      {/* Add Device Modal */}
      <Modal
        isOpen={showAddDevice}
        onClose={() => setShowAddDevice(false)}
        title="Add New Device"
        size="md"
      >
        <div className="space-y-4">
          <Input label="Device Name" placeholder="e.g., Living Room Light" />
          <Select
            label="Device Type"
            options={[
              { value: '', label: 'Select type' },
              { value: 'light', label: 'Smart Light' },
              { value: 'thermostat', label: 'Thermostat' },
              { value: 'lock', label: 'Smart Lock' },
              { value: 'camera', label: 'Security Camera' },
            ]}
          />
          <Select
            label="Zone"
            options={[
              { value: '', label: 'Select zone' },
              ...zones.map((zone) => ({ value: zone.id, label: zone.name })),
            ]}
          />
          <Input label="Device ID" placeholder="Unique device identifier" />
        </div>

        <div className="mt-6 flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setShowAddDevice(false)}>
            Cancel
          </Button>
          <Button variant="primary">Add Device</Button>
        </div>
      </Modal>
    </div>
  );
};

export default DeviceControlPanel;
