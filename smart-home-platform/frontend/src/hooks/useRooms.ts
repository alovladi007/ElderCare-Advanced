import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roomsAPI } from '@/lib/api';
import type { Room } from '@/types';

export function useRooms(homeId?: string) {
  const queryClient = useQueryClient();

  const { data: rooms = [], isLoading, error } = useQuery({
    queryKey: ['rooms', homeId],
    queryFn: () => roomsAPI.list(homeId),
    enabled: !!homeId,
  });

  const createRoomMutation = useMutation({
    mutationFn: ({ homeId, name, icon }: { homeId: string; name: string; icon?: string }) =>
      roomsAPI.create(homeId, name, icon),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });

  const updateRoomMutation = useMutation({
    mutationFn: ({ roomId, updates }: { roomId: string; updates: Partial<Room> }) =>
      roomsAPI.update(roomId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });

  const deleteRoomMutation = useMutation({
    mutationFn: (roomId: string) => roomsAPI.delete(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });

  return {
    rooms,
    isLoading,
    error,
    createRoom: createRoomMutation.mutate,
    updateRoom: updateRoomMutation.mutate,
    deleteRoom: deleteRoomMutation.mutate,
    isCreating: createRoomMutation.isPending,
    isUpdating: updateRoomMutation.isPending,
    isDeleting: deleteRoomMutation.isPending,
  };
}
