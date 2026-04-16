import { Server, Socket } from 'socket.io';
import { GameManager } from '../game-runner/GameManager';
import { Card, CardRequestType, CardType } from '../types/types';
import { Game } from '../game-runner/Game';

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


    // --- INITIAL UI LOAD HANDSHAKE ---
    socket.on('request_initial_state', (data: { roomId: string, userId: string }) => {
      const { roomId, userId } = data;
      
      const game = GameManager.getInstance().getGame(roomId);
      if (!game) return;

      const player = game.playerList.find(p => p.userId === userId);

      socket.data.userId = userId; // Store userId on socket for easy access in future events
      
      if (player) {
        // Send this specific player their hand
        socket.emit('update_hand', { fullHand: player.hand });
        
        // Send them the current board state
        socket.emit('game_state_update', {
          activeUserId: game.activePlayer.userId,
          topCard: game.discardPile.pile[game.discardPile.pile.length - 1],
          deckCount: game.drawDeck.deck.length
        });
        
        console.log(`Sent initial game state to ${player.name}`);
      }
    });
    
    /**
     * Draw Card. Fired when a player wants to draw a card, ending their turn.
     * * Expects: { roomId: string }
     * * Emits back to THIS player: receive_card — their updated hand
     * Broadcasts to ALL in the room: player_draws_card — who drew (no card details)
     */
    socket.on('draw_card', (data: { roomId: string, userId: string }) => {
      const { roomId, userId } = data;
      const game = GameManager.getInstance().getGame(roomId);

      if (!game) return;

      const player = game.playerList.find(p => p.userId === userId);
      if (!player) return;

      try {
        const result = player.drawCard(game);
        
        // Always send updated hand to the person who drew
        socket.emit('update_hand', { fullHand: player.hand });

        if (result.exploded) {
          io.to(`lobby:${roomId}`).emit('player_exploded', { userId: player.userId });
        } else if (result.defusePending) {
          // Send specific event to showing the slider for defuse placement
          socket.emit('action_requires_target', { 
            actionType: CardRequestType.Replace_Exploding_Kitten,
            cardId: result.drawnCard.id 
          });
        }

        // Broadcast turn end/state update
        io.to(`lobby:${roomId}`).emit('game_state_update', {
          activeUserId: game.activePlayer.userId,
          topCard: game.discardPile.pile[game.discardPile.pile.length - 1],
          deckCount: game.drawDeck.deck.length
        });

      } catch (err: any) {
        socket.emit('error', { message: err.message });
      }
    });

    /**
     * Play Card. Fired when a player wants to play a card.
     * * Expects: { roomId: string, cardIds: number[] }
     * * Broadcasts to ALL in the room: player_plays_card — who played and what cards
     */
    socket.on('play_card', (data: { roomId: string, cardIds: number[] }) => {
      const { roomId, cardIds } = data;
      const game = GameManager.getInstance().getGame(roomId);
      const userId = socket.data.userId;

      if (!game || !userId) return;

      const player = game.playerList.find(p => p.userId === userId);
      if (!player || game.activePlayer !== player) return;

      // Filter hand to get the actual card objects
      const selectedCards = player.hand.filter(c => cardIds.includes(c.id));
      player.selectedCards = selectedCards;

      if (player.checkMove()) {
          socket.emit('error', { message: "Invalid move" });
          return;
      }

      // Remove from hand
      player.hand = player.hand.filter(c => !cardIds.includes(c.id));
      socket.emit('update_hand', { fullHand: player.hand });

      // Action is now pending the Nope window
      game.pendingAction = {
          playerId: player.userId,
          cards: selectedCards
      };

      io.to(`lobby:${roomId}`).emit('player_plays_card', { 
          userId: player.userId, 
          cards: selectedCards 
      });

      startNopeTimer(game, roomId, io);
    });

    /**
     * Play Nope. Fired when any player wants to play a Nope card to cancel the current pending action.
     * * Expects: { roomId: string, cardId: number }
     * * Broadcasts to ALL in the room: player_plays_card — who played the Nope card
     */
    socket.on('play_nope', (data: { roomId: string, cardId: number }) => {
        const { roomId, cardId } = data;
        const game = GameManager.getInstance().getGame(roomId);
        const userId = socket.data.userId;

        if (!game || !game.pendingAction) return;

        const player = game.playerList.find(p => p.userId === userId);
        if (!player) return;

        const nopeCard = player.hand.find(c => c.id === cardId && c.type === CardType.Nope);
        if (!nopeCard) return;

        // Remove from hand
        player.hand = player.hand.filter(c => c.id !== cardId);
        socket.emit('update_hand', { fullHand: player.hand });

        game.nopeStack.push(nopeCard);

        io.to(`lobby:${roomId}`).emit('player_plays_card', { 
            userId: player.userId, 
            cards: [nopeCard] 
        });

        // Reset the 5 second window
        startNopeTimer(game, roomId, io);
    });

    /**
     * Submit Target. Fired when an action requires further input like a target player or deck position.
     * * Expects: { roomId: string, targetId?: string, deckIndex?: number, cardType?: CardType }
     */
    socket.on('submit_target', (data: { roomId: string, targetId?: string, deckIndex?: number, cardType?: CardType }) => {
        const { roomId, targetId, deckIndex, cardType } = data;
        const game = GameManager.getInstance().getGame(roomId);
        const userId = socket.data.userId;

        if (!game || !userId) return;

        const sourcePlayer = game.playerList.find(p => p.userId === userId);
        if (!sourcePlayer) return;

        // Handle Exploding Kitten placement
        if (deckIndex !== undefined && sourcePlayer.pendingDefuseKitten) {
            game.drawDeck.replaceExplodingKitten(sourcePlayer.pendingDefuseKitten, deckIndex);
            sourcePlayer.pendingDefuseKitten = null;
            
            io.to(`lobby:${roomId}`).emit('game_state_update', {
                activeUserId: game.activePlayer.userId,
                topCard: game.discardPile.pile[game.discardPile.pile.length - 1],
                deckCount: game.drawDeck.deck.length
            });
            return;
        }
    });

    // Leaves room when disconnected
        socket.on('disconnect', async () => {
          const { roomId, userId } = socket.data;
          if (roomId && userId) {
            try {
              // TODO: Create new processPlayerLeave for game state
              //await processPlayerLeave(roomId, userId, io);
            } catch (error) {
              console.error("Socket disconnect cleanup failed:", error);
            }
          }
        });
      
  });

  /**
   * Starts or resets the 5-second timer for players to react with a Nope card.
   * 
   * @param game the current game state
   * @param roomId the room ID to emit events to
   * @param io the socket.io Server instance
   */
  function startNopeTimer(game: Game, roomId: string, io: Server) {
    if (game.nopeTimer) clearTimeout(game.nopeTimer);

    game.nopeTimer = setTimeout(() => {
        const action = game.pendingAction;
        if (!action) return;

        const actingPlayer = game.playerList.find(p => p.userId === action.playerId);
        if (!actingPlayer) {
            game.clearPendingAction();
            return;
        }

        const isNoped = game.nopeStack.length % 2 !== 0;

        if (isNoped) {
            game.discardPile.addCards(action.cards);
            game.discardPile.addCards(game.nopeStack);
            io.to(`lobby:${roomId}`).emit('action_resolved', { message: "Action was Noped!" });
        } else {
            const result = actingPlayer.executeFinalEffect(action.cards, game);
            game.discardPile.addCards(action.cards);
            game.discardPile.addCards(game.nopeStack);

            if (result.futureCards || result.cardRequest) {
                io.in(`lobby:${roomId}`).fetchSockets().then(sockets => {
                    const s = sockets.find(s => s.data.userId === actingPlayer.userId);
                    if (s) {
                        if (result.futureCards) s.emit('see_the_future', { cards: result.futureCards });
                        if (result.cardRequest) s.emit('action_requires_target', { actionType: result.cardRequest });
                    }
                });
            }
        }

        game.clearPendingAction();
        io.to(`lobby:${roomId}`).emit('game_state_update', {
            activeUserId: game.activePlayer.userId,
            topCard: game.discardPile.pile[game.discardPile.pile.length - 1],
            deckCount: game.drawDeck.deck.length
        });

    }, 5000);
  }

  /**
   * Helper function to securely update two different clients' hands at the same time
   * 
   * @param roomId the room ID
   * @param sourcePlayer the player receiving a card
   * @param targetPlayer the player giving a card
   * @param stolenCard the card being transferred
   * @param io the socket.io Server instance
   * @param sourceSocket the socket of the source player
   */
  function updateBothHands(roomId: string, sourcePlayer: any, targetPlayer: any, stolenCard: Card, io: Server, sourceSocket: Socket) {
    // Update Source Player (The one who played the card)
    sourceSocket.emit('update_hand', { fullHand: sourcePlayer.hand, stolenCard });
    
    // Find the Target Player's socket and update them
    io.in(`lobby:${roomId}`).fetchSockets().then(sockets => {
      const targetSocket = sockets.find(s => s.data.userId === targetPlayer.userId);
      if (targetSocket) {
        targetSocket.emit('update_hand', { fullHand: targetPlayer.hand });
      }
    });
  }
}