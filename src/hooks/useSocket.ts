import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  text: string;
  senderName: string;
  senderType: 'patient' | 'doctor';
  timestamp: string;
}

interface Participant {
  id: string;
  type: 'patient' | 'doctor';
  name: string;
  connected: boolean;
}

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isRoomReady, setIsRoomReady] = useState(false);

  useEffect(() => {
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

    const newSocket = io(SOCKET_URL, {
      transports: ['websocket'],
      secure: SOCKET_URL.startsWith('https'),
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(newSocket);

    newSocket.on('room-joined', ({ participants: roomParticipants, messages: roomMessages }) => {
      setParticipants(roomParticipants);
      setMessages(roomMessages);
    });

    newSocket.on('user-joined', ({ participants: updatedParticipants }) => {
      setParticipants(updatedParticipants);
    });

    newSocket.on('user-left', ({ userId }) => {
      setParticipants(prev => prev.filter(p => p.id !== userId));
    });

    newSocket.on('room-ready', () => {
      setIsRoomReady(true);
    });

    newSocket.on('new-message', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const joinRoom = (roomId: string, userType: 'patient' | 'doctor', userName: string) => {
    if (socket) {
      socket.emit('join-room', { roomId, userType, userName });
    }
  };

  const sendMessage = (roomId: string, message: string, senderName: string, senderType: 'patient' | 'doctor') => {
    if (socket) {
      socket.emit('send-message', { roomId, message, senderName, senderType });
    }
  };

  const endConsultation = (roomId: string) => {
    if (socket) {
      socket.emit('call-ended', { roomId });
    }
  };

  return {
    socket,
    messages,
    participants,
    isRoomReady,
    joinRoom,
    sendMessage,
    endConsultation
  };
};