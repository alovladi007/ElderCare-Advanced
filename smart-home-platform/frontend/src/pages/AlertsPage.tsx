import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

export default function AlertsPage() {
  const alerts = [
    {
      id: '1',
      severity: 'low',
      status: 'open',
      message: 'Front door battery low',
      time: '5 minutes ago',
      icon: Info,
    },
    {
      id: '2',
      severity: 'medium',
      status: 'open',
      message: 'Unusual activity detected on security camera',
      time: '1 hour ago',
      icon: AlertTriangle,
    },
    {
      id: '3',
      severity: 'low',
      status: 'resolved',
      message: 'Thermostat offline',
      time: '3 hours ago',
      icon: CheckCircle,
    },
  ];

  const severityVariant = {
    low: 'info' as const,
    medium: 'warning' as const,
    high: 'danger' as const,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Alerts</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          View and manage system alerts
        </p>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => (
          <Card key={alert.id}>
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-full bg-${alert.severity === 'low' ? 'blue' : 'orange'}-100 dark:bg-${alert.severity === 'low' ? 'blue' : 'orange'}-900/30 flex items-center justify-center flex-shrink-0`}>
                <alert.icon className={`text-${alert.severity === 'low' ? 'blue' : 'orange'}-600`} size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant={severityVariant[alert.severity]}>
                    {alert.severity}
                  </Badge>
                  <Badge variant={alert.status === 'resolved' ? 'success' : 'default'}>
                    {alert.status}
                  </Badge>
                </div>
                <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                  {alert.message}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {alert.time}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
