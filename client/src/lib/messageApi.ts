// client/src/lib/messageApi.ts — PropSync In-App Messaging
import { api } from './api';

export interface MessageUser {
  _id: string;
  name: string;
  email: string;
}

export interface ChatMessage {
  _id: string;
  conversationId: string;
  senderId: MessageUser;
  content: string;
  readBy: string[];
  createdAt: string;
}

export interface Conversation {
  _id: string;
  participants: MessageUser[];
  propertyId: { _id: string; name: string; address: { city: string } } | null;
  applicationId: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export const messageApi = {
  getConversations: (): Promise<Conversation[]> =>
    api.get('/messages/conversations').then(r => r.data),

  getMessages: (conversationId: string): Promise<ChatMessage[]> =>
    api.get(`/messages/conversations/${conversationId}`).then(r => r.data),

  sendMessage: (conversationId: string, content: string): Promise<ChatMessage> =>
    api.post(`/messages/conversations/${conversationId}/send`, { content }).then(r => r.data),

  getUnreadCount: (): Promise<{ count: number }> =>
    api.get('/messages/unread-count').then(r => r.data),

  startTenantChat: (): Promise<{ conversationId: string }> =>
    api.post('/messages/tenant/start-chat').then(r => r.data),
};
