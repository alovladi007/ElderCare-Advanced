import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { LoggerService } from '../common/logging/logger.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:31610',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedClients: Map<string, { socket: Socket; userId: string }> = new Map();

  constructor(private logger: LoggerService) {}

  /**
   * Handle client connection
   */
  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;

    if (!userId) {
      this.logger.warn('WebSocket connection without userId', 'NotificationsGateway', {
        clientId: client.id,
      });
      client.disconnect();
      return;
    }

    this.connectedClients.set(client.id, { socket: client, userId });

    // Join user-specific room
    client.join(`user:${userId}`);

    this.logger.debug('WebSocket client connected', 'NotificationsGateway', {
      clientId: client.id,
      userId,
      totalClients: this.connectedClients.size,
    });

    // Send welcome message
    client.emit('connected', {
      message: 'Connected to notifications',
      clientId: client.id,
    });
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: Socket) {
    const clientData = this.connectedClients.get(client.id);

    if (clientData) {
      this.logger.debug('WebSocket client disconnected', 'NotificationsGateway', {
        clientId: client.id,
        userId: clientData.userId,
        totalClients: this.connectedClients.size - 1,
      });

      this.connectedClients.delete(client.id);
    }
  }

  /**
   * Subscribe to specific elder's notifications
   */
  @SubscribeMessage('subscribe:elder')
  handleSubscribeElder(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { elderId: string },
  ) {
    client.join(`elder:${data.elderId}`);

    this.logger.debug('Client subscribed to elder notifications', 'NotificationsGateway', {
      clientId: client.id,
      elderId: data.elderId,
    });

    return { event: 'subscribed', data: { elderId: data.elderId } };
  }

  /**
   * Unsubscribe from elder's notifications
   */
  @SubscribeMessage('unsubscribe:elder')
  handleUnsubscribeElder(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { elderId: string },
  ) {
    client.leave(`elder:${data.elderId}`);

    this.logger.debug('Client unsubscribed from elder notifications', 'NotificationsGateway', {
      clientId: client.id,
      elderId: data.elderId,
    });

    return { event: 'unsubscribed', data: { elderId: data.elderId } };
  }

  /**
   * Mark notification as read
   */
  @SubscribeMessage('notification:read')
  handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { notificationId: string },
  ) {
    const clientData = this.connectedClients.get(client.id);

    if (clientData) {
      this.logger.debug('Notification marked as read', 'NotificationsGateway', {
        userId: clientData.userId,
        notificationId: data.notificationId,
      });
    }

    return { event: 'notification:read:success', data };
  }

  /**
   * Send notification to specific user
   */
  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);

    this.logger.debug('Notification sent to user', 'NotificationsGateway', {
      userId,
      event,
    });
  }

  /**
   * Send notification to all users monitoring an elder
   */
  sendToElderMonitors(elderId: string, event: string, data: any) {
    this.server.to(`elder:${elderId}`).emit(event, data);

    this.logger.debug('Notification sent to elder monitors', 'NotificationsGateway', {
      elderId,
      event,
    });
  }

  /**
   * Broadcast to all connected clients
   */
  broadcast(event: string, data: any) {
    this.server.emit(event, data);

    this.logger.debug('Notification broadcast to all clients', 'NotificationsGateway', {
      event,
      totalClients: this.connectedClients.size,
    });
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Get connected clients for specific user
   */
  getUserConnections(userId: string): Socket[] {
    const connections: Socket[] = [];

    this.connectedClients.forEach((clientData) => {
      if (clientData.userId === userId) {
        connections.push(clientData.socket);
      }
    });

    return connections;
  }
}
