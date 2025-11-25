import { Home, Moon, Plane, BedDouble } from 'lucide-react';
import type { HomeMode } from '@/types';
import Card from '@/components/ui/Card';

interface HomeModeToggleProps {
  currentMode: HomeMode;
  onChange: (mode: HomeMode) => void;
}

const modes: Array<{ value: HomeMode; label: string; icon: any; color: string }> = [
  { value: 'HOME', label: 'Home', icon: Home, color: 'bg-green-500' },
  { value: 'AWAY', label: 'Away', icon: Plane, color: 'bg-blue-500' },
  { value: 'SLEEP', label: 'Sleep', icon: BedDouble, color: 'bg-purple-500' },
  { value: 'VACATION', label: 'Vacation', icon: Plane, color: 'bg-orange-500' },
];

export default function HomeModeToggle({ currentMode, onChange }: HomeModeToggleProps) {
  return (
    <Card>
      <h3 className="text-lg font-semibold mb-4">Home Mode</h3>
      <div className="grid grid-cols-2 gap-3">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isActive = currentMode === mode.value;

          return (
            <button
              key={mode.value}
              onClick={() => onChange(mode.value)}
              className={`p-4 rounded-lg border-2 transition-all ${
                isActive
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <div className={`w-12 h-12 rounded-full ${mode.color} flex items-center justify-center`}>
                  <Icon className="text-white" size={24} />
                </div>
                <span className="font-medium text-sm">{mode.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
