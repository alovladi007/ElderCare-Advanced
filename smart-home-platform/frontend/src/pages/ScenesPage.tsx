import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Sparkles, Sun, Moon, Home, Coffee, Plus } from 'lucide-react';

export default function ScenesPage() {
  const scenes = [
    {
      id: '1',
      name: 'Good Morning',
      description: 'Start your day right',
      icon: Sun,
      color: 'orange',
    },
    {
      id: '2',
      name: 'Good Night',
      description: 'Wind down for bed',
      icon: Moon,
      color: 'purple',
    },
    {
      id: '3',
      name: 'Movie Time',
      description: 'Perfect lighting for movies',
      icon: Sparkles,
      color: 'blue',
    },
    {
      id: '4',
      name: 'Away Mode',
      description: 'Secure your home',
      icon: Home,
      color: 'red',
    },
    {
      id: '5',
      name: 'Work Mode',
      description: 'Focus and productivity',
      icon: Coffee,
      color: 'green',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Scenes</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Activate preset lighting and device configurations
          </p>
        </div>
        <Button variant="primary">
          <Plus size={18} className="mr-2" />
          Create Scene
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scenes.map((scene) => (
          <Card key={scene.id}>
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto rounded-full bg-${scene.color}-100 dark:bg-${scene.color}-900/30 flex items-center justify-center mb-4`}>
                <scene.icon className={`text-${scene.color}-600`} size={28} />
              </div>
              <h3 className="text-lg font-semibold mb-2">{scene.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {scene.description}
              </p>
              <Button variant="primary" className="w-full">
                Activate
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
