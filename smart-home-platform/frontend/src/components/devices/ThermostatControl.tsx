import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import type { Device } from '@/types';

interface ThermostatControlProps {
  device: Device;
  onUpdate: (state: Record<string, any>) => void;
}

export default function ThermostatControl({ device, onUpdate }: ThermostatControlProps) {
  const [temperature, setTemperature] = useState(device.state.target_temperature || 70);
  const [mode, setMode] = useState(device.state.mode || 'heat');

  const handleTempChange = (delta: number) => {
    const newTemp = temperature + delta;
    setTemperature(newTemp);
    onUpdate({ target_temperature: newTemp, mode });
  };

  const handleModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMode = e.target.value;
    setMode(newMode);
    onUpdate({ target_temperature: temperature, mode: newMode });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleTempChange(-1)}
        >
          <Minus size={16} />
        </Button>

        <div className="text-center">
          <div className="text-4xl font-bold">{temperature}°F</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Current: {device.state.current_temperature || temperature}°F
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleTempChange(1)}
        >
          <Plus size={16} />
        </Button>
      </div>

      <Select
        label="Mode"
        value={mode}
        onChange={handleModeChange}
        options={[
          { value: 'off', label: 'Off' },
          { value: 'heat', label: 'Heat' },
          { value: 'cool', label: 'Cool' },
          { value: 'auto', label: 'Auto' },
        ]}
      />
    </div>
  );
}
