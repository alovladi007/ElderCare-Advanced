import { Shield, Thermometer, Cloud, Lightbulb } from 'lucide-react';
import Card from '@/components/ui/Card';
import type { HomeSummary } from '@/types';

interface HomeStatusCardProps {
  summary: HomeSummary;
}

export default function HomeStatusCard({ summary }: HomeStatusCardProps) {
  return (
    <Card>
      <h3 className="text-lg font-semibold mb-4">Home Status</h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              summary.allSecure ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
            }`}>
              <Shield className={summary.allSecure ? 'text-green-600' : 'text-red-600'} size={20} />
            </div>
            <div>
              <p className="font-medium">Security</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {summary.allSecure ? 'All Secure' : 'Attention Needed'}
              </p>
            </div>
          </div>
        </div>

        {summary.outsideTemperature !== undefined && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Thermometer className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="font-medium">Temperature</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {summary.outsideTemperature}°F outside
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <Lightbulb className="text-yellow-600" size={20} />
            </div>
            <div>
              <p className="font-medium">Devices</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {summary.devicesOn} of {summary.totalDevices} on
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
