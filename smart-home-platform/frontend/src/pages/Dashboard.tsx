import Card from '@/components/ui/Card';
import { Home, Lightbulb, Thermometer, Lock, Zap, Activity } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Welcome Home</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Your Smart Home Platform
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Lightbulb className="text-blue-600" size={20} />
            </div>
            <h3 className="font-semibold">Devices</h3>
          </div>
          <p className="text-2xl font-bold">12</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">8 online</p>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Home className="text-green-600" size={20} />
            </div>
            <h3 className="font-semibold">Rooms</h3>
          </div>
          <p className="text-2xl font-bold">5</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">All configured</p>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Zap className="text-purple-600" size={20} />
            </div>
            <h3 className="font-semibold">Scenes</h3>
          </div>
          <p className="text-2xl font-bold">6</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Ready to use</p>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Activity className="text-orange-600" size={20} />
            </div>
            <h3 className="font-semibold">Automations</h3>
          </div>
          <p className="text-2xl font-bold">4</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">3 active</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
              <div className="flex items-center gap-3">
                <Lightbulb size={18} className="text-blue-600" />
                <span className="font-medium">Good Night Scene</span>
              </div>
            </button>
            <button className="w-full text-left px-4 py-3 rounded-lg bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
              <div className="flex items-center gap-3">
                <Home size={18} className="text-green-600" />
                <span className="font-medium">Away Mode</span>
              </div>
            </button>
            <button className="w-full text-left px-4 py-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
              <div className="flex items-center gap-3">
                <Thermometer size={18} className="text-purple-600" />
                <span className="font-medium">Climate Control</span>
              </div>
            </button>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Living Room lights turned on</p>
                <p className="text-xs text-gray-500">5 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Thermostat set to 72°F</p>
                <p className="text-xs text-gray-500">15 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-purple-500 mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Morning routine activated</p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-orange-500 mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Front door locked</p>
                <p className="text-xs text-gray-500">3 hours ago</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-semibold mb-4">Rooms Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-medium mb-2">Living Room</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">3 devices active</p>
          </div>
          <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-medium mb-2">Bedroom</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">2 devices active</p>
          </div>
          <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-medium mb-2">Kitchen</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">2 devices active</p>
          </div>
          <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-medium mb-2">Bathroom</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">1 device active</p>
          </div>
          <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-medium mb-2">Office</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">2 devices active</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
