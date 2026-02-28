import { Server, Socket } from 'socket.io';

export function setupLobbySockets(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log('Player connected:', socket.id);

    // Listen for 'join_room' (matches frontend)
    socket.on('join_room', (roomId) => {
      socket.join(`lobby:${roomId}`);
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

    socket.on('disconnect', () => {
      console.log('Player disconnected:', socket.id);
    });
  });
}