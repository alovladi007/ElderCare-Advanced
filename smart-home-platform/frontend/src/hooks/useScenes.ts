import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scenesAPI } from '@/lib/api';
import type { Scene } from '@/types';

export function useScenes(homeId?: string) {
  const queryClient = useQueryClient();

  const { data: scenes = [], isLoading, error } = useQuery({
    queryKey: ['scenes', homeId],
    queryFn: () => scenesAPI.list(homeId),
    enabled: !!homeId,
  });

  const activateSceneMutation = useMutation({
    mutationFn: (sceneId: string) => scenesAPI.activate(sceneId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const createSceneMutation = useMutation({
    mutationFn: ({ homeId, name, icon, deviceStates }: {
      homeId: string;
      name: string;
      icon?: string;
      deviceStates: Array<{ device_id: string; target_state: Record<string, any> }>;
    }) => scenesAPI.create(homeId, name, icon, deviceStates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenes'] });
    },
  });

  const updateSceneMutation = useMutation({
    mutationFn: ({ sceneId, updates }: { sceneId: string; updates: Partial<Scene> }) =>
      scenesAPI.update(sceneId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenes'] });
    },
  });

  const deleteSceneMutation = useMutation({
    mutationFn: (sceneId: string) => scenesAPI.delete(sceneId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenes'] });
    },
  });

  return {
    scenes,
    isLoading,
    error,
    activateScene: activateSceneMutation.mutate,
    createScene: createSceneMutation.mutate,
    updateScene: updateSceneMutation.mutate,
    deleteScene: deleteSceneMutation.mutate,
    isActivating: activateSceneMutation.isPending,
    isCreating: createSceneMutation.isPending,
    isUpdating: updateSceneMutation.isPending,
    isDeleting: deleteSceneMutation.isPending,
  };
}
