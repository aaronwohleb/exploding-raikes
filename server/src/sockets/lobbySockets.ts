import { Server, Socket } from 'socket.io';
import { processPlayerLeave } from '../controllers/lobbyController';

export function setupLobbySockets(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log('Player connected:', socket.id);

    // Listen for 'join_room' (matches frontend)
    socket.on('join_room', (data) => {
      const { roomId, userId } = data;
      socket.join(`lobby:${roomId}`);
      socket.data.roomId = roomId;
      socket.data.userId = userId;
      console.log(`Socket ${socket.id} joined lobby room: ${roomId}`);
    });

    // Listen for 'leave_room' (matches frontend)
    socket.on('leave_room', () => {
      // Leave all rooms except the default room (socket.id)
      const rooms = Array.from(socket.rooms);
      rooms.forEach(room => {
        if (room !== socket.id) {
          socket.leave(room);
          console.log(`Socket ${socket.id} left room: ${room}`);
        }
      });
    });

    // Leaves room when disconnected
    socket.on('disconnect', async () => {
      const { roomId, userId } = socket.data;
      if (roomId && userId) {
        try {
          await processPlayerLeave(roomId, userId, io);
        } catch (error) {
          console.error("Socket disconnect cleanup failed:", error);
        }
      }
    });
  });
}