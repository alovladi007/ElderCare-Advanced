import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { roomsAPI } from '@/lib/api';
import { useDevices } from '@/hooks/useDevices';
import { ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import DeviceCard from '@/components/devices/DeviceCard';

export default function RoomDetailPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const { data: room } = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => roomsAPI.get(roomId!),
    enabled: !!roomId,
  });

  const { devices, updateState } = useDevices(roomId);

  if (!room) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => navigate('/rooms')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
        >
          <ArrowLeft size={20} />
          Back to Rooms
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              {room.icon && <span className="text-4xl">{room.icon}</span>}
              {room.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {devices.length} devices
            </p>
          </div>
          <Button variant="primary">
            Add Device
          </Button>
        </div>
      </div>

      {devices.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            No devices in this room. Add your first device to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              onUpdate={updateState}
            />
          ))}
        </div>
      )}
    </div>
  );
}
