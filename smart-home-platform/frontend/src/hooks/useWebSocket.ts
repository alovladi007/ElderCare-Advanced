import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { WebSocketMessage } from '@/types';

export function useWebSocket(url: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);

        switch (message.type) {
          case 'device_state_changed':
            queryClient.invalidateQueries({ queryKey: ['devices'] });
            queryClient.invalidateQueries({ queryKey: ['rooms'] });
            break;
          case 'alert_created':
            queryClient.invalidateQueries({ queryKey: ['alerts'] });
            break;
          case 'automation_fired':
            queryClient.invalidateQueries({ queryKey: ['events'] });
            queryClient.invalidateQueries({ queryKey: ['automations'] });
            break;
          case 'scene_activated':
            queryClient.invalidateQueries({ queryKey: ['scenes'] });
            queryClient.invalidateQueries({ queryKey: ['events'] });
            break;
        }
      } catch (error) {
        console.error('WebSocket message parsing error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      ws.close();
    };
  }, [url, queryClient]);

  return wsRef.current;
}
