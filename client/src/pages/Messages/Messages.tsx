// client/src/pages/Messages/Messages.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { messageApi } from '../../lib/messageApi';
import type { Conversation, ChatMessage } from '../../lib/messageApi';
import { io, Socket } from 'socket.io-client';
import './Messages.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Messages: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch Conversations
  const { data: conversations, isLoading: loadingConvs } = useQuery({
    queryKey: ['conversations'],
    queryFn: messageApi.getConversations,
    refetchInterval: 30000,
  });

  // Fetch Messages for active conversation
  const { data: messages, isLoading: loadingMsgs } = useQuery({
    queryKey: ['messages', activeConvId],
    queryFn: () => messageApi.getMessages(activeConvId!),
    enabled: !!activeConvId,
  });

  // Send Message Mutation
  const sendMutation = useMutation({
    mutationFn: (content: string) => messageApi.sendMessage(activeConvId!, content),
    onSuccess: (newMsg) => {
      queryClient.setQueryData<ChatMessage[]>(['messages', activeConvId], (old = []) => [...old, newMsg]);
      setNewMessage('');
    }
  });

  // Socket Setup
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('token');
    const newSocket = io(`${API_URL}/users`, {
      auth: { token },
      query: { token }
    });

    newSocket.on('new_chat_message', (payload: { conversationId: string; message: ChatMessage }) => {
      queryClient.setQueryData<ChatMessage[]>(['messages', payload.conversationId], (old) => {
        if (!old) return old;
        // avoid duplicates if we somehow get it twice
        if (old.some(m => m._id === payload.message._id)) return old;
        return [...old, payload.message];
      });
      // Invalidate conversations to update unread counts and last message
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['unread_count'] });
    });

    setSocket(newSocket);
    return () => { newSocket.disconnect(); };
  }, [user, queryClient]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Mark As Read when conversation changes
  useEffect(() => {
    if (activeConvId) {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['unread_count'] });
    }
  }, [activeConvId, queryClient]);


  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConvId) return;
    sendMutation.mutate(newMessage);
  };

  const getOtherParticipant = (conv: Conversation) => {
    return conv.participants.find(p => p._id !== user?._id) || conv.participants[0];
  };

  return (
    <div className="messages-page">
      <div className="messages-container">
        
        {/* Sidebar */}
        <div className="messages-sidebar">
          <div className="sidebar-header">
            <h2>Messages</h2>
          </div>
          <div className="conv-list">
            {loadingConvs && <p style={{ padding: '1rem', color: '#94a3b8' }}>Loading...</p>}
            {!loadingConvs && conversations?.length === 0 && (
              <div className="empty-state">No active conversations.</div>
            )}
            {conversations?.map(conv => {
              const otherUser = getOtherParticipant(conv);
              const isActive = activeConvId === conv._id;
              return (
                <div 
                  key={conv._id} 
                  className={`conv-item ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveConvId(conv._id)}
                >
                  <div className="conv-avatar">
                    {otherUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="conv-info">
                    <div className="conv-name">
                      {otherUser.name}
                      {conv.unreadCount > 0 && <span className="unread-badge">{conv.unreadCount}</span>}
                    </div>
                    <div className="conv-prop">{conv.propertyId?.name || 'Property'}</div>
                    <div className="conv-last-msg">{conv.lastMessage || 'No messages yet'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat Area */}
        <div className="messages-chat">
          {!activeConvId ? (
            <div className="chat-empty">
              <span className="chat-empty-icon">💬</span>
              <h3>Select a conversation</h3>
              <p>Choose a conversation from the sidebar to start chatting.</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="chat-header">
                {conversations?.find(c => c._id === activeConvId) && (
                  <>
                    <div className="conv-avatar">
                      {getOtherParticipant(conversations.find(c => c._id === activeConvId)!).name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1rem' }}>
                        {getOtherParticipant(conversations.find(c => c._id === activeConvId)!).name}
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                        {conversations.find(c => c._id === activeConvId)?.propertyId?.name}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Chat Messages */}
              <div className="chat-messages">
                {loadingMsgs && <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '2rem' }}>Loading messages...</p>}
                {messages?.map(msg => {
                  const isMe = msg.senderId._id === user?._id;
                  return (
                    <div key={msg._id} className={`message-bubble-wrapper ${isMe ? 'me' : 'them'}`}>
                      <div className={`message-bubble ${isMe ? 'me' : 'them'}`}>
                        {msg.content}
                      </div>
                      <div className="message-time">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <form className="chat-input-area" onSubmit={handleSend}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  className="chat-input"
                />
                <button type="submit" className="chat-send-btn" disabled={!newMessage.trim() || sendMutation.isPending}>
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
