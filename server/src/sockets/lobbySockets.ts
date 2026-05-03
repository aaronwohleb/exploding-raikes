import { Server, Socket } from 'socket.io';
import { processPlayerLeave } from '../controllers/lobbyController';
import { GameManager } from '../game-runner/GameManager';
import { Lobby } from '../types/Lobby';
import { Player } from '../game-runner/Player';

export function setupLobbySockets(io: Server) {
  io.on('connection', (socket: Socket) => {
    socket.on('join_room', (data) => {
      const { roomId, userId } = data;
      socket.join(`lobby:${roomId}`);
      socket.data.roomId = roomId;
    });

    socket.on('leave_room', () => {
      // Leave all rooms except the default room (socket.id)
      const rooms = Array.from(socket.rooms);
      rooms.forEach(room => {
        if (room !== socket.id) {
          socket.leave(room);
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

  socket.on('start_game', async (data) => {
  const { roomId } = data;

  // Fetch the lobby and its players
  try {
    const lobby = await Lobby.findOne({ code: roomId.toUpperCase() }).populate('players', 'username email');
    if (!lobby) return;
    lobby.status = 'starting';
    await lobby.save();

    const players: Player[] = [];
    // Create Player instances and assign playerNums based on the order in the lobby
    lobby.players.forEach((player: any, i: number) => {
          players.push(new Player(player.username, i, player._id.toString()));
        });

    // Create the game and emit the initial hands to each player
    GameManager.getInstance().createGame(roomId, players);


    io.to(`lobby:${lobby.code}`).emit('game_started', { roomId });
  } catch (e) {
    console.error(e);
  }
});
  });
}