import { formatDistanceToNow } from 'date-fns';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import type { Event } from '@/types';

interface ActivityTimelineProps {
  events: Event[];
}

const severityVariant = {
  info: 'info' as const,
  warning: 'warning' as const,
  error: 'danger' as const,
  critical: 'danger' as const,
};

export default function ActivityTimeline({ events }: ActivityTimelineProps) {
  return (
    <Card>
      <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>

      {events.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 py-8">
          No recent activity
        </p>
      ) : (
        <div className="space-y-4">
          {events.slice(0, 10).map((event) => (
            <div key={event.id} className="flex items-start gap-3">
              <div className="w-2 h-2 mt-2 rounded-full bg-primary-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {event.message}
                  </p>
                  <Badge variant={severityVariant[event.severity]}>
                    {event.severity}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
