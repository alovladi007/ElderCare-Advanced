import Badge from '@/components/ui/Badge';

interface AutomationStatusBadgeProps {
  enabled: boolean;
}

export default function AutomationStatusBadge({ enabled }: AutomationStatusBadgeProps) {
  return (
    <Badge variant={enabled ? 'success' : 'default'}>
      {enabled ? 'Active' : 'Disabled'}
    </Badge>
  );
}
