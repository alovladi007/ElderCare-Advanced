import { formatDistanceToNow } from 'date-fns';
import { Trash2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import Button from '@/components/ui/Button';
import AutomationStatusBadge from './AutomationStatusBadge';
import type { Automation } from '@/types';

interface AutomationListItemProps {
  automation: Automation;
  onToggle: () => void;
  onDelete: () => void;
}

export default function AutomationListItem({ automation, onToggle, onDelete }: AutomationListItemProps) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-lg">{automation.name}</h3>
            <AutomationStatusBadge enabled={automation.enabled} />
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p>
              {automation.triggers.length} trigger(s) · {automation.actions.length} action(s)
              {automation.conditions && automation.conditions.length > 0 && ` · ${automation.conditions.length} condition(s)`}
            </p>
            {automation.last_fired && (
              <p>
                Last fired: {formatDistanceToNow(new Date(automation.last_fired), { addSuffix: true })}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ToggleSwitch
            checked={automation.enabled}
            onChange={onToggle}
          />
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 size={16} />
          </Button>
        </div>
      </div>
    </Card>
  );
}
