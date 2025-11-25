import { useState } from 'react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import DeviceIcon from './DeviceIcon';
import DeviceControlPanel from './DeviceControlPanel';
import type { Device } from '@/types';

interface DeviceCardProps {
  device: Device;
  onUpdate: (deviceId: string, state: Record<string, any>) => void;
}

export default function DeviceCard({ device, onUpdate }: DeviceCardProps) {
  const [showControls, setShowControls] = useState(false);

  return (
    <Card>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            device.online
              ? 'bg-primary-100 dark:bg-primary-900/30'
              : 'bg-gray-100 dark:bg-gray-700'
          }`}>
            <DeviceIcon
              type={device.type}
              className={device.online ? 'text-primary-600' : 'text-gray-400'}
            />
          </div>
          <div>
            <h3 className="font-semibold">{device.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
              {device.type}
            </p>
          </div>
        </div>

        <Badge variant={device.online ? 'success' : 'default'}>
          {device.online ? 'Online' : 'Offline'}
        </Badge>
      </div>

      {device.online && (
        <div>
          <button
            onClick={() => setShowControls(!showControls)}
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            {showControls ? 'Hide Controls' : 'Show Controls'}
          </button>

          {showControls && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <DeviceControlPanel
                device={device}
                onUpdate={(state) => onUpdate(device.id, state)}
              />
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
