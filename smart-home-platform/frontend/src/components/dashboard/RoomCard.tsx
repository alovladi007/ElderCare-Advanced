import { Lightbulb, Thermometer } from 'lucide-react';
import Card from '@/components/ui/Card';
import type { Room } from '@/types';

interface RoomCardProps {
  room: Room;
  onClick?: () => void;
}

export default function RoomCard({ room, onClick }: RoomCardProps) {
  return (
    <Card onClick={onClick}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-lg">{room.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {room.deviceCount || 0} devices
          </p>
        </div>
        {room.icon && (
          <span className="text-2xl">{room.icon}</span>
        )}
      </div>

      <div className="flex items-center gap-4 text-sm">
        {room.devicesOn !== undefined && (
          <div className="flex items-center gap-2">
            <Lightbulb size={16} className="text-yellow-500" />
            <span>{room.devicesOn} on</span>
          </div>
        )}

        {room.temperature !== undefined && (
          <div className="flex items-center gap-2">
            <Thermometer size={16} className="text-blue-500" />
            <span>{room.temperature}°F</span>
          </div>
        )}
      </div>
    </Card>
  );
}
