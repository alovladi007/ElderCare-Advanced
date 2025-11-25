import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import { Zap, Clock, Sunrise, Sunset, Plus } from 'lucide-react';

export default function AutomationsPage() {
  const automations = [
    { id: '1', name: 'Morning Routine', description: 'Turn on lights at sunrise', enabled: true, icon: Sunrise },
    { id: '2', name: 'Night Mode', description: 'Lock doors and turn off lights at 11 PM', enabled: true, icon: Sunset },
    { id: '3', name: 'Away Detection', description: 'Turn off devices when nobody is home', enabled: false, icon: Zap },
    { id: '4', name: 'Temperature Control', description: 'Adjust thermostat based on time', enabled: true, icon: Clock },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Automations</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create automated rules for your smart home
          </p>
        </div>
        <Button variant="primary">
          <Plus size={18} className="mr-2" />
          Create Automation
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {automations.map((automation) => (
          <Card key={automation.id}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <automation.icon className="text-purple-600" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold">{automation.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {automation.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant={automation.enabled ? 'success' : 'secondary'}>
                  {automation.enabled ? 'Enabled' : 'Disabled'}
                </Badge>
                <ToggleSwitch checked={automation.enabled} onChange={() => {}} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
