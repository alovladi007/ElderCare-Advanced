import { useNavigate } from 'react-router-dom';
import RoomCard from './RoomCard';
import type { Room } from '@/types';

interface RoomsOverviewGridProps {
  rooms: Room[];
}

export default function RoomsOverviewGrid({ rooms }: RoomsOverviewGridProps) {
  const navigate = useNavigate();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Rooms</h2>
        <button
          onClick={() => navigate('/rooms')}
          className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
        >
          View All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            onClick={() => navigate(`/rooms/${room.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
