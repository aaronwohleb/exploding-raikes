import { Server, Socket } from 'socket.io';
import { Game } from '../game-runner/Game';
import { Player } from '../game-runner/Player';
import { activeGames } from '../game-runner/GameManager';

/**
 * Registers all game-related socket events on the server.
 *
 * Handles
 * - Emitted from client: draw_card, play_card
 * - Emitted to client:   receive_card, player_draws_card, player_plays_card, see_the_future
 *
 * @param io - The socket.io Server instance created in server.ts.
 */
export function setupGameSockets(io: Server) {
  io.on('connection', (socket: Socket) => {

    /**
     * Draw Card. Fired when a player wants to draw a card, ending their turn.
     * 
     * Expects: { roomId: string }
     * 
     * Emits back to THIS player:      receive_card      — their updated hand
     * Broadcasts to ALL in the room:  player_draws_card — who drew (no card details)
     */
    socket.on('draw_card', (data: { roomId: string }) => {
      const { roomId } = data;
      const game = activeGames.get(roomId);

      if (!game) {
        console.error(`draw_card: no active game found for room ${roomId}`);
        return;
      }

      const player = game.playerList.find(p => p.name === socket.data.userId);

      if (!player) {
        console.error(`draw_card: player ${socket.data.userId} not found in game ${roomId}`);
        return;
      }

      // MIGHT NEED TO CHECK IF THIS IS CORRECT
      const drawnCard = player.drawCard(game);


      // Send this player's full updated hand to prevent desync, along with the just drawn card for animation purposes
      socket.emit('update_hand', { fullHand: player.hand, justDrawnCard: drawnCard });

      // Broadcast to everyone in the room that this player drew (no card details)
      io.to(`game:${roomId}`).emit('player_draws_card', {
        playerId: socket.data.userId
      });

      console.log(`draw_card: player ${socket.data.userId} drew a card in room ${roomId}`);
    });


    /**
     * PLAY CARD. Fired when a player wants to play one or more cards from their hand.
     * 
     * Expects: { roomId: string, cardIds: number[] }
     * 
     * Broadcasts to ALL in the room: player_plays_card — what was played
     * Emits back to THIS player:     see_the_future    — only if See the Future was played
     */
    socket.on('play_card', (data: { roomId: string, cardIds: number[], targetPlayerId?: string }) => {
      const { roomId, cardIds, targetPlayerId } = data;
      const game = activeGames.get(roomId);

      if (!game) {
        console.error(`play_card: no active game found for room ${roomId}`);
        return;
      }

      const player = game.playerList.find(p => p.name === socket.data.userId);

      if (!player) {
        console.error(`play_card: player ${socket.data.userId} not found in game ${roomId}`);
        return;
      }
      
      const playedCards = player.hand.filter(card => cardIds.includes(card.id));

      player.playCards(game, cardIds);
      

      // Broadcast to everyone in the room what was played
      io.to(`game:${roomId}`).emit('player_plays_cards', {
        playedCards,
        playerId: socket.data.userId
      });

      // Send this player's full updated hand to prevent desync, along with null for justDrawnCard since this is a play, not a draw
      socket.emit('update_hand', { fullHand: player.hand, justDrawnCard: null });

      // If See the Future was played, send the top 3 cards only to this player
      const playedSeeTheFuture = playedCards.some(card => card.type === 'See_the_Future');
      if (playedSeeTheFuture) {
        const topThree = game.drawDeck.seeFuture(3); 
        socket.emit('see_the_future', topThree);
      }

      console.log(`play_card: player ${socket.data.userId} played cards ${cardIds} in room ${roomId}`);
    });

  });
}


