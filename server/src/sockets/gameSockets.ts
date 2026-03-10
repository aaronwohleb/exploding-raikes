import { Server, Socket } from 'socket.io';
import { GameManager } from '../game-runner/GameManager';
import { Card } from '../types/types';

//Setup for game sockets
export function setupGameSockets(io: Server) {
  io.on('connection', (socket: Socket) => {
    // Listen for 'join_game' (matches frontend)
    socket.on('draw_card', (data: { roomId: string }) => {
      const { roomId } = data;
      const game = GameManager.getInstance().getGame(roomId);
      if (!game) return;

      // Find the player based on the socket's playerNum 
      const player = game.playerList.find(p => p.playerNum === socket.data.playerNum);
      if (!player) return;

      // Player draws a card
      const drawnCard = player.drawCard(game);
      socket.emit('update_hand', { fullHand: player.hand });
      // Broadcast to all players that this player drew a card (without revealing the card)
      io.to(`game:${roomId}`).emit('player_draws_card', {
        playerNum: player.playerNum,
        deckCount: game.drawDeck.deck.length
      });
    });

  // Listen for 'play_card' (matches frontend)
  socket.on('play_card', (data: { roomId: string, cards: Card[], targetPlayerNum?: number }) => {
  // Destructure the data from the event
  const { roomId, cards, targetPlayerNum } = data;
  const game = GameManager.getInstance().getGame(roomId);
  if (!game) return;

  // Find the player based on the socket's playerNum
  const player = game.playerList.find(p => p.playerNum === socket.data.playerNum);
  if (!player) return;
  // Process the played cards (remove from hand, add to discard pile, etc.)
  try {
    const playedIds = cards.map(c => c.id);
    player.hand = player.hand.filter(c => !playedIds.includes(c.id));
    game.discardPile.addCards(cards);
    
    // Broadcast to all players that this player played cards
    io.to(`game:${roomId}`).emit('player_plays_cards', {
      playerId: player.playerNum.toString(),
      playedCards: cards, 
      targetPlayerNum
    });

  } catch (error) {
    console.error("Server failed to process play_card:", error);
  }
});
  });
}