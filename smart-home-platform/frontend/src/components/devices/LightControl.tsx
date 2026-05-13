import { useState } from 'react';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import Slider from '@/components/ui/Slider';
import type { Device } from '@/types';

interface LightControlProps {
  device: Device;
  onUpdate: (state: Record<string, any>) => void;
}

export default function LightControl({ device, onUpdate }: LightControlProps) {
  const [brightness, setBrightness] = useState(device.state.brightness || 100);
  const [isOn, setIsOn] = useState(device.state.on || false);

  const handleToggle = (checked: boolean) => {
    setIsOn(checked);
    onUpdate({ on: checked, brightness });
  };

  const handleBrightnessChange = (value: string) => {
    const newBrightness = parseInt(value);
    setBrightness(newBrightness);
  };

  const handleBrightnessRelease = () => {
    onUpdate({ on: isOn, brightness });
  };

  return (
    <div className="space-y-4">
      <ToggleSwitch
        checked={isOn}
        onChange={handleToggle}
        label="Power"
      />

      {isOn && device.capabilities?.includes('brightness') && (
        <Slider
          label="Brightness"
          min={0}
          max={100}
          value={brightness}
          onChange={(e) => handleBrightnessChange(e.target.value)}
          onMouseUp={handleBrightnessRelease}
          onTouchEnd={handleBrightnessRelease}
          showValue
        />
      )}

      {isOn && device.capabilities?.includes('color') && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Color
          </label>
          <div className="flex gap-2">
            {['#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'].map((color) => (
              <button
                key={color}
                onClick={() => onUpdate({ on: isOn, brightness, color })}
                className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
