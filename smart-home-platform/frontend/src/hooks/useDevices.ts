import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { devicesAPI } from '@/lib/api';
import type { Device } from '@/types';

export function useDevices(roomId?: string) {
  const queryClient = useQueryClient();

  const { data: devices = [], isLoading, error } = useQuery({
    queryKey: ['devices', roomId],
    queryFn: () => devicesAPI.list(roomId),
  });

  const updateStateMutation = useMutation({
    mutationFn: ({ deviceId, state }: { deviceId: string; state: Record<string, any> }) =>
      devicesAPI.updateState(deviceId, state),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });

  const sendCommandMutation = useMutation({
    mutationFn: ({ deviceId, command }: { deviceId: string; command: Record<string, any> }) =>
      devicesAPI.sendCommand(deviceId, command),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });

  return {
    devices,
    isLoading,
    error,
    updateState: updateStateMutation.mutate,
    sendCommand: sendCommandMutation.mutate,
    isUpdating: updateStateMutation.isPending,
  };
}
