import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('NotificationsGateway');
  private connectedClients = new Map<string, string[]>(); // userId -> socketIds[]

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Remove client from all user mappings
    for (const [userId, socketIds] of this.connectedClients.entries()) {
      const filtered = socketIds.filter((id) => id !== client.id);
      if (filtered.length === 0) {
        this.connectedClients.delete(userId);
      } else {
        this.connectedClients.set(userId, filtered);
      }
    }
  }

  @SubscribeMessage('register')
  handleRegister(client: Socket, userId: string) {
    const existing = this.connectedClients.get(userId) || [];
    if (!existing.includes(client.id)) {
      existing.push(client.id);
      this.connectedClients.set(userId, existing);
    }
    this.logger.log(`User ${userId} registered with socket ${client.id}`);
    return { event: 'registered', data: { userId } };
  }

  sendNotification(userId: string, notification: any) {
    const socketIds = this.connectedClients.get(userId);
    if (socketIds) {
      socketIds.forEach((socketId) => {
        this.server.to(socketId).emit('notification', notification);
      });
    }
  }

  sendBulkNotification(userIds: string[], notification: any) {
    userIds.forEach((userId) => {
      this.sendNotification(userId, notification);
    });
  }
}
