import { Lock, Unlock } from 'lucide-react';
import Button from '@/components/ui/Button';
import type { Device } from '@/types';

interface LockControlProps {
  device: Device;
  onUpdate: (state: Record<string, any>) => void;
}

export default function LockControl({ device, onUpdate }: LockControlProps) {
  const isLocked = device.state.locked;

  return (
    <div>
      <Button
        variant={isLocked ? 'secondary' : 'primary'}
        className="w-full"
        onClick={() => onUpdate({ locked: !isLocked })}
      >
        {isLocked ? (
          <>
            <Unlock size={20} className="mr-2" />
            Unlock
          </>
        ) : (
          <>
            <Lock size={20} className="mr-2" />
            Lock
          </>
        )}
      </Button>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
        Currently: {isLocked ? 'Locked' : 'Unlocked'}
      </p>
    </div>
  );
}
