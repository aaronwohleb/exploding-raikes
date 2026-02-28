import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as api from '../services/api';
import { LobbyState } from '../types/types';
import { useGameSocket } from './SocketContext';


interface LobbyContextType {
  currentLobby: LobbyState | null;
  createNewLobby: (userId: string) => Promise<string>;
  joinExistingLobby: (code: string, userId: string) => Promise<void>;
  clearLobby: () => void;
  toggleReadyStatus: (userId: string, isReady: boolean) => Promise<void>;
}

const LobbyContext = createContext<LobbyContextType | undefined>(undefined);

export function LobbyProvider({ children }: { children: ReactNode }) {
  const [currentLobby, setCurrentLobby] = useState<LobbyState | null>(null);
  const { socket, joinRoom, leaveRoom } = useGameSocket();


    // --- SOCKET LISTENERS ---
useEffect(() => {
    if (!socket) return;

    // 1. Listen for new players joining
    const handlePlayerJoined = (data: any) => {
      console.log("Socket heard a new player join!", data);
      
      setCurrentLobby((prevLobby) => {
        if (!prevLobby) return prevLobby;
        
        // Safety check: Prevent duplicating the player if React fires twice
        if (prevLobby.players.some(p => p._id === data.userId)) return prevLobby;

        // Map the backend 'userId' to the frontend '_id'
        const newPlayer = {
          _id: data.userId,
          username: data.username
        };

        return {
          ...prevLobby,
          players: [...prevLobby.players, newPlayer],
          readyStatus: { ...prevLobby.readyStatus, [data.userId]: false } 
        } as LobbyState; // TypeScript fix: forcefully cast as LobbyState
      });
    };

    // 2. Listen for players changing their ready status
    const handlePlayerReady = (data: any) => {
      console.log("Socket heard a player ready up!", data);

      setCurrentLobby((prevLobby) => {
        if (!prevLobby) return prevLobby;
        return {
          ...prevLobby,
          readyStatus: { ...prevLobby.readyStatus, [data.userId]: data.isReady }
        } as LobbyState; // TypeScript fix
      });
    };

    // 3. Listen for players leaving
    const handlePlayerLeft = (data: any) => {
      console.log("Socket heard a player leave!", data);

      setCurrentLobby((prevLobby) => {
        if (!prevLobby) return prevLobby;
        
        const updatedReadyStatus = { ...prevLobby.readyStatus };
        delete updatedReadyStatus[data.userId]; // Clean up the dictionary

        return {
          ...prevLobby,
          players: prevLobby.players.filter(p => p._id !== data.userId),
          readyStatus: updatedReadyStatus
        } as LobbyState; // TypeScript fix
      });
    };

    // Turn the listeners on using the exact strings from your Express backend
    socket.on('player-joined', handlePlayerJoined);
    socket.on('player-ready', handlePlayerReady);
    socket.on('player-left', handlePlayerLeft);

    // Turn the listeners off when the component unmounts
    return () => {
      socket.off('player-joined', handlePlayerJoined);
      socket.off('player-ready', handlePlayerReady);
      socket.off('player-left', handlePlayerLeft);
    };
  }, [socket]);

  const createNewLobby = async (userId: string) => {
    const newLobby = await api.createLobby(userId);
    console.log("New lobby created:", newLobby);
    console.log("Joining room with code:", newLobby.code);
    setCurrentLobby(newLobby);
    joinRoom(newLobby.code);
    
    return newLobby.code;
  };

  const joinExistingLobby = async (code: string, userId: string) => {
    const joinedLobby = await api.joinLobby(code, userId);
    setCurrentLobby(joinedLobby);
    joinRoom(joinedLobby.code);
  };

  const clearLobby = () => {
    if (currentLobby) {
      leaveRoom(currentLobby.code);
    }
    setCurrentLobby(null);
  };

  const toggleReadyStatus = async (userId: string, isReady: boolean) => {
    if (!currentLobby) return;

    setCurrentLobby((prevLobby) => {
      if (!prevLobby) return prevLobby;
      return {
        ...prevLobby,
        readyStatus: {
          ...prevLobby.readyStatus,
          [userId]: isReady
        }
      };
    });

    try {
      await api.updateReadyStatus(currentLobby.code, userId, isReady);
    } catch (error) {
      console.error("Failed to update ready status on server");
      setCurrentLobby((prevLobby) => {
        if (!prevLobby) return prevLobby;
        return {
          ...prevLobby,
          readyStatus: {
            ...prevLobby.readyStatus,
            [userId]: !isReady // Flip it back
          }
        };
      });
    }
  };

  return (
    <LobbyContext.Provider value={{ currentLobby, createNewLobby, joinExistingLobby, clearLobby, toggleReadyStatus }}>
      {children}
    </LobbyContext.Provider>
  );
}

export const useLobby = () => {
  const context = useContext(LobbyContext);
  if (!context) throw new Error('useLobby must be used within LobbyProvider');
  return context;
};