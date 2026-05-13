import Card from '@/components/ui/Card';
import { BarChart3, TrendingUp, Zap, Clock } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Insights and analytics for your smart home
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Zap className="text-blue-600" size={20} />
            </div>
            <h3 className="font-semibold">Energy Usage</h3>
          </div>
          <p className="text-2xl font-bold">682 kWh</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">This month</p>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <TrendingUp className="text-green-600" size={20} />
            </div>
            <h3 className="font-semibold">Savings</h3>
          </div>
          <p className="text-2xl font-bold">12%</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">vs last month</p>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <BarChart3 className="text-purple-600" size={20} />
            </div>
            <h3 className="font-semibold">Automations Run</h3>
          </div>
          <p className="text-2xl font-bold">342</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">This month</p>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Clock className="text-orange-600" size={20} />
            </div>
            <h3 className="font-semibold">Avg Response</h3>
          </div>
          <p className="text-2xl font-bold">248ms</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Device response</p>
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-semibold mb-4">Energy Usage Trends</h3>
        <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
          Chart placeholder - Recharts implementation coming soon
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold mb-4">Device Usage</h3>
          <div className="h-48 flex items-center justify-center text-gray-500 dark:text-gray-400">
            Chart placeholder - Device usage breakdown
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold mb-4">Room Activity</h3>
          <div className="h-48 flex items-center justify-center text-gray-500 dark:text-gray-400">
            Chart placeholder - Room activity heatmap
          </div>
        </Card>
      </div>
    </div>
  );
}
