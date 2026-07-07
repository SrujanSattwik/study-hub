import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';
import { API_URL } from '../services/api';

export const useSocket = (groupId?: string) => {
  const { user, token } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [onlineMembers, setOnlineMembers] = useState<Record<string, { userName: string; status: string }>>({});
  const [raisedHands, setRaisedHands] = useState<Record<string, { userName: string; raised: boolean }>>({});

  // 1. Initialize global socket instance
  useEffect(() => {
    if (!user || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    const socket = io(API_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      // Automatically register user with backend
      socket.emit('registerUser', {
        userId: user.user_id,
        token: token,
        userName: user.full_name,
      });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('presenceChanged', (data: { userId: string; userName: string; status: string }) => {
      setOnlineMembers((prev) => ({
        ...prev,
        [data.userId]: { userName: data.userName, status: data.status },
      }));
    });

    // Clean up on unmount
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, token]);

  // 2. Handle group room actions
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !groupId || !user) return;

    socket.emit('joinGroup', { groupId, userId: user.user_id });

    socket.on('recentMessages', (data: { groupId: string; messages: any[] }) => {
      if (data.groupId === groupId) {
        setMessages(data.messages);
      }
    });

    socket.on('newGroupMessage', (msg: any) => {
      if (msg.groupId === groupId) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    socket.on('userTyping', (data: { groupId: string; userId: string; isTyping: boolean }) => {
      if (data.groupId === groupId) {
        setTypingUsers((prev) => ({
          ...prev,
          [data.userId]: data.isTyping,
        }));
      }
    });

    socket.on('handRaised', (data: { userId: string; userName: string; raised: boolean }) => {
      setRaisedHands((prev) => ({
        ...prev,
        [data.userId]: { userName: data.userName, raised: data.raised },
      }));
    });

    // Cleanup listeners when room changes
    return () => {
      socket.off('recentMessages');
      socket.off('newGroupMessage');
      socket.off('userTyping');
      socket.off('handRaised');
    };
  }, [groupId, user, isConnected]);

  // 3. Emitter Functions
  const sendMessage = useCallback((content: string, parentId: string | null = null) => {
    const socket = socketRef.current;
    if (socket && groupId && user) {
      socket.emit('sendGroupMessage', {
        groupId,
        userId: user.user_id,
        content,
        parentId,
      });
    }
  }, [groupId, user]);

  const sendTyping = useCallback((isTyping: boolean) => {
    const socket = socketRef.current;
    if (socket && groupId && user) {
      socket.emit('typing', {
        groupId,
        userId: user.user_id,
        isTyping,
      });
    }
  }, [groupId, user]);

  const sendDraw = useCallback((eventData: any) => {
    const socket = socketRef.current;
    if (socket && groupId) {
      socket.emit('draw', {
        groupId,
        ...eventData,
      });
    }
  }, [groupId]);

  const sendClearWhiteboard = useCallback(() => {
    const socket = socketRef.current;
    if (socket && groupId) {
      socket.emit('clearWhiteboard', { groupId });
    }
  }, [groupId]);

  const sendRaiseHand = useCallback((raised: boolean) => {
    const socket = socketRef.current;
    if (socket && groupId && user) {
      socket.emit('raiseHand', {
        groupId,
        userId: user.user_id,
        userName: user.full_name,
        raised,
      });
    }
  }, [groupId, user]);

  return {
    socket: socketRef.current,
    isConnected,
    messages,
    typingUsers,
    onlineMembers,
    raisedHands,
    sendMessage,
    sendTyping,
    sendDraw,
    sendClearWhiteboard,
    sendRaiseHand,
  };
};
export default useSocket;
