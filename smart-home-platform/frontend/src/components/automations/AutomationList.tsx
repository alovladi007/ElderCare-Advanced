import AutomationListItem from './AutomationListItem';
import type { Automation } from '@/types';

interface AutomationListProps {
  automations: Automation[];
  onToggle: (automationId: string) => void;
  onDelete: (automationId: string) => void;
}

export default function AutomationList({ automations, onToggle, onDelete }: AutomationListProps) {
  return (
    <div className="space-y-3">
      {automations.map((automation) => (
        <AutomationListItem
          key={automation.id}
          automation={automation}
          onToggle={() => onToggle(automation.id)}
          onDelete={() => onDelete(automation.id)}
        />
      ))}
    </div>
  );
}
