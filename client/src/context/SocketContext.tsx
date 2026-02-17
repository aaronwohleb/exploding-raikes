import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth(); // We need the user to authenticate the socket

  useEffect(() => {
    // Initialize Socket if user is logged in
    if (user && !socket) {
      const newSocket = io('http://localhost:3000', {
        autoConnect: false,
        auth: { token: localStorage.getItem('token') } // Send JWT if you have one
      });

      setSocket(newSocket);

      newSocket.on('connect', () => setIsConnected(true));
      newSocket.on('disconnect', () => setIsConnected(false));
      
      // TODO: Add global game listeners to catch global events (ie kicking a player)

      newSocket.connect();

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user]);

  const joinRoom = (roomId: string) => {
    if (socket) {
      socket.emit('join_room', { roomId, userId: user?._id });
    }
  };

  const leaveRoom = () => {
    if (socket) {
      socket.emit('leave_room');
    }
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, joinRoom, leaveRoom }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useGameSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useGameSocket must be used within a SocketProvider');
  }
  return context;
}