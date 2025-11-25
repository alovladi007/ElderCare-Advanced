import Card from '@/components/ui/Card';
import { Home, Lightbulb, Thermometer, Plus } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function RoomsPage() {
  const rooms = [
    { id: '1', name: 'Living Room', devices: 3, icon: Home },
    { id: '2', name: 'Bedroom', devices: 2, icon: Home },
    { id: '3', name: 'Kitchen', devices: 2, icon: Home },
    { id: '4', name: 'Bathroom', devices: 1, icon: Home },
    { id: '5', name: 'Office', devices: 2, icon: Home },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rooms</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your smart home rooms
          </p>
        </div>
        <Button variant="primary">
          <Plus size={18} className="mr-2" />
          Add Room
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <Card key={room.id}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <room.icon className="text-blue-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{room.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {room.devices} devices
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center gap-2">
                  <Lightbulb size={16} className="text-gray-600 dark:text-gray-400" />
                  <span className="text-sm">Main Light</span>
                </div>
                <span className="text-xs text-green-600 dark:text-green-400">ON</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center gap-2">
                  <Thermometer size={16} className="text-gray-600 dark:text-gray-400" />
                  <span className="text-sm">Thermostat</span>
                </div>
                <span className="text-xs text-blue-600 dark:text-blue-400">72°F</span>
              </div>
            </div>

            <Button variant="secondary" className="w-full mt-4">
              View Details
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
