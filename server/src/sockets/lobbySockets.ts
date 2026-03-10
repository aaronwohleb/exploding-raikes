import { Server, Socket } from 'socket.io';
import { processPlayerLeave } from '../controllers/lobbyController';
import { GameManager } from '../game-runner/GameManager';
import { Lobby } from '../types/Lobby';
import { Player } from '../game-runner/Player';

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

  // Listen for 'start_game' (matches frontend)
  socket.on('start_game', async (data) => {
  // Destructure the data from the event
  const { roomId } = data;
  const lobbyRoom = `lobby:${roomId}`;
  const gameRoom = `game:${roomId}`;

  // Fetch the lobby and its players
  try {
    const lobby = await Lobby.findOne({ code: roomId.toUpperCase() }).populate('players');
    if (!lobby) return;
    const sockets = await io.in(lobbyRoom).fetchSockets();
    const players: Player[] = [];
    // Create Player instances and assign playerNums based on the order in the lobby
    lobby.players.forEach((player: any, i: number) => {
      players.push(new Player(player.username, i));
      const pSocket = sockets.find(s => s.data.userId === player._id.toString());
      if (pSocket) {
        pSocket.data.playerNum = i; 
        pSocket.join(gameRoom);
      }
    });

    // Create the game and emit the initial hands to each player
    GameManager.getInstance().createGame(roomId, players);
    const game = GameManager.getInstance().getGame(roomId);
    game?.playerList.forEach(player => {
      const pSocket = sockets.find(s => s.data.playerNum === player.playerNum);
      if (pSocket) {
        pSocket.emit('update_hand', { fullHand: player.hand });
      }
    });

    io.to(lobbyRoom).emit('game_started');
  } catch (e) {
    console.error(e);
  }
});
  });
}