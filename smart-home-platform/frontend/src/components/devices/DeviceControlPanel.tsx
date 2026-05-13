import LightControl from './LightControl';
import ThermostatControl from './ThermostatControl';
import LockControl from './LockControl';
import type { Device } from '@/types';

interface DeviceControlPanelProps {
  device: Device;
  onUpdate: (state: Record<string, any>) => void;
}

export default function DeviceControlPanel({ device, onUpdate }: DeviceControlPanelProps) {
  switch (device.type) {
    case 'light':
      return <LightControl device={device} onUpdate={onUpdate} />;
    case 'thermostat':
      return <ThermostatControl device={device} onUpdate={onUpdate} />;
    case 'lock':
      return <LockControl device={device} onUpdate={onUpdate} />;
    case 'switch':
      return (
        <div>
          <button
            onClick={() => onUpdate({ on: !device.state.on })}
            className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
              device.state.on
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            {device.state.on ? 'Turn Off' : 'Turn On'}
          </button>
        </div>
      );
    default:
      return (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          No controls available for this device type
        </div>
      );
  }
}
