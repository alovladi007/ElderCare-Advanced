import { useQuery } from '@tanstack/react-query';
import { eventsAPI, alertsAPI } from '@/lib/api';

export function useEvents(homeId?: string, limit: number = 50) {
  const { data: events = [], isLoading, error } = useQuery({
    queryKey: ['events', homeId, limit],
    queryFn: () => eventsAPI.list(homeId, limit),
    enabled: !!homeId,
    refetchInterval: 10000,
  });

  return {
    events,
    isLoading,
    error,
  };
}

export function useAlerts(status?: 'open' | 'acknowledged' | 'resolved') {
  const { data: alerts = [], isLoading, error } = useQuery({
    queryKey: ['alerts', status],
    queryFn: () => alertsAPI.list(status),
    refetchInterval: 5000,
  });

  return {
    alerts,
    isLoading,
    error,
  };
}
