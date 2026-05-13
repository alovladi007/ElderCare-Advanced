import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { automationsAPI } from '@/lib/api';
import type { Automation } from '@/types';

export function useAutomations(homeId?: string) {
  const queryClient = useQueryClient();

  const { data: automations = [], isLoading, error } = useQuery({
    queryKey: ['automations', homeId],
    queryFn: () => automationsAPI.list(homeId),
    enabled: !!homeId,
  });

  const toggleAutomationMutation = useMutation({
    mutationFn: (automationId: string) => automationsAPI.toggle(automationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
    },
  });

  const createAutomationMutation = useMutation({
    mutationFn: (automation: Omit<Automation, 'id' | 'created_at' | 'last_fired'>) =>
      automationsAPI.create(automation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
    },
  });

  const deleteAutomationMutation = useMutation({
    mutationFn: (automationId: string) => automationsAPI.delete(automationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
    },
  });

  return {
    automations,
    isLoading,
    error,
    toggleAutomation: toggleAutomationMutation.mutate,
    createAutomation: createAutomationMutation.mutate,
    deleteAutomation: deleteAutomationMutation.mutate,
    isToggling: toggleAutomationMutation.isPending,
    isCreating: createAutomationMutation.isPending,
    isDeleting: deleteAutomationMutation.isPending,
  };
}
