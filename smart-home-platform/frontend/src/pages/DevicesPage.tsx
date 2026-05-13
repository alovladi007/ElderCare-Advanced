import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Lightbulb, Thermometer, Lock, Camera, Power, Plus } from 'lucide-react';

export default function DevicesPage() {
  const devices = [
    { id: '1', name: 'Living Room Light', type: 'Light', room: 'Living Room', status: 'online', icon: Lightbulb },
    { id: '2', name: 'Main Thermostat', type: 'Thermostat', room: 'Hallway', status: 'online', icon: Thermometer },
    { id: '3', name: 'Front Door Lock', type: 'Lock', room: 'Entry', status: 'online', icon: Lock },
    { id: '4', name: 'Kitchen Light', type: 'Light', room: 'Kitchen', status: 'offline', icon: Lightbulb },
    { id: '5', name: 'Bedroom Light', type: 'Light', room: 'Bedroom', status: 'online', icon: Lightbulb },
    { id: '6', name: 'Security Camera', type: 'Camera', room: 'Front Yard', status: 'online', icon: Camera },
    { id: '7', name: 'Office Light', type: 'Light', room: 'Office', status: 'online', icon: Lightbulb },
    { id: '8', name: 'Smart Switch', type: 'Switch', room: 'Living Room', status: 'online', icon: Power },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Devices</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage all your smart devices
          </p>
        </div>
        <Button variant="primary">
          <Plus size={18} className="mr-2" />
          Add Device
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {devices.map((device) => (
          <Card key={device.id}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <device.icon className="text-blue-600" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold">{device.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {device.type} • {device.room}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant={device.status === 'online' ? 'success' : 'secondary'}>
                  {device.status}
                </Badge>
                <Button variant="secondary" size="sm">
                  Control
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
