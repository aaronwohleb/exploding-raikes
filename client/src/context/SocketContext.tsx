import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth(); // We need the user to authenticate the socket

  useEffect(() => {
    // Initialize Socket if user is logged in by pulling user's JWT
    const token = localStorage.getItem('token');
    if (user && token && !socket) {
      const newSocket = io('http://localhost:3001', {
        autoConnect: true,
        auth: { token }, 
        reconnection: true,
        reconnectionAttempts: 5
      });

      setSocket(newSocket);

      // listeners
      newSocket.on('connect', () => {
        console.log("socket connected with ID:", newSocket.id);
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log("socket disconnected")
        setIsConnected(false);
    });
      // TODO: Add global game listeners to catch global events (ie kicking a player)

      newSocket.connect();

      return () => {
        newSocket.disconnect();
        setSocket(null);
      };
    }
  }, [user]);

  const joinRoom = (roomId: string) => {
    if (socket && isConnected) {
      socket.emit('join_room', roomId);
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