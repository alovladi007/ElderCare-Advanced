import { Lightbulb, Thermometer, Lock, Radio, Camera, Power } from 'lucide-react';
import type { DeviceType } from '@/types';

interface DeviceIconProps {
  type: DeviceType;
  size?: number;
  className?: string;
}

const iconMap = {
  light: Lightbulb,
  thermostat: Thermometer,
  lock: Lock,
  sensor: Radio,
  camera: Camera,
  switch: Power,
};

export default function DeviceIcon({ type, size = 20, className = '' }: DeviceIconProps) {
  const Icon = iconMap[type] || Power;

  return <Icon size={size} className={className} />;
}
