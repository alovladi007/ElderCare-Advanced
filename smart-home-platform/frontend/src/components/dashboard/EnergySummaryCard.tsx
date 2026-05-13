import { Zap, TrendingDown } from 'lucide-react';
import Card from '@/components/ui/Card';

export default function EnergySummaryCard() {
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Energy Usage</h3>
        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <Zap className="text-green-600" size={20} />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-3xl font-bold">24.8 kWh</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Today</p>
        </div>

        <div className="flex items-center gap-2 text-green-600">
          <TrendingDown size={16} />
          <span className="text-sm font-medium">12% less than yesterday</span>
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">This month</span>
            <span className="font-medium">682 kWh</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Est. cost</span>
            <span className="font-medium">$95.48</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
