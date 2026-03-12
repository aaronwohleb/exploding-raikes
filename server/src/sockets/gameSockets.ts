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
          topCard: game.discardPile.topCard,
          deckCount: game.drawDeck.deck.length
        });
        
        console.log(`Sent initial game state to ${player.name}`);
      }
    });
    
    /**
     * Draw Card. Fired when a player wants to draw a card, ending their turn.
     * 
     * Expects: { roomId: string }
     * 
     * Emits back to THIS player:      receive_card      — their updated hand
     * Broadcasts to ALL in the room:  player_draws_card — who drew (no card details)
     */
    socket.on('draw_card', (data: { roomId: string, userId: string }) => {
      const { roomId, userId } = data;
      const game = GameManager.getInstance().getGame(roomId);

      if (!game) {
        console.error(`draw_card: no active game found for room ${roomId}`);
        return;
      }

      try {
        const player = game.playerList.find(p => p.userId === userId);

        if (!player) {
          console.error(`draw_card: player ${userId} not found in game ${roomId}`);
          return;
        }

        // MIGHT NEED TO CHECK IF THIS IS CORRECT
        const result = player.drawCard(game);

        if (result.exploded) {
             io.to(`lobby:${roomId}`).emit('action_resolved', { message: `${player.name} EXPLODED!` });
             socket.emit('update_hand', { fullHand: player.hand }); 
             io.to(`lobby:${roomId}`).emit('game_state_update', {
                 activeUserId: game.activePlayer.userId,
                 topCard: result.drawnCard,
                 deckCount: game.drawDeck.deck.length
             });
             return;
        }

        if (result.defusePending) {
            console.log(`${player.name} is attempting to defuse an exploding kitten! Waiting for slider input...`);
             socket.emit('update_hand', { fullHand: player.hand }); // Updates UI to show Defuse is gone
             
             // Tell the frontend to pop up the slider
             socket.emit('defuse_requires_index', { maxIndex: game.drawDeck.deck.length });
             
             io.to(`lobby:${roomId}`).emit('action_resolved', { message: `${player.name} drew an Exploding Kitten and is DEFUSING IT!` });
             return;
        }

        // Send this player's full updated hand to prevent desync, along with the just drawn card for animation purposes
        socket.emit('update_hand', { fullHand: player.hand, justDrawnCard: result.drawnCard });

        // Broadcast to everyone in the room that this player drew (no card details)
        io.to(`lobby:${roomId}`).emit('player_draws_card', {
          playerId: userId,
          deckCount: game.drawDeck.deck.length
        });

        io.to(`lobby:${roomId}`).emit('game_state_update', {
            activeUserId: game.activePlayer.userId,
            topCard: game.discardPile.topCard,
            deckCount: game.drawDeck.deck.length
          });

        console.log(`draw_card: player ${userId} drew a card in room ${roomId}`);

      } catch (error: any) {
        // Catch the "Not your turn" error thrown by Player.ts
        socket.emit('play_error', { message: error.message });
      }
    });

    socket.on('submit_defuse_location', (data: { roomId: string, userId: string, insertIndex: number }) => {
        const { roomId, userId, insertIndex } = data;
        const unifiedRoom = `lobby:${roomId}`;
        
        const game = GameManager.getInstance().getGame(roomId);
        if (!game) return;

        const player = game.playerList.find(p => p.userId === userId);
        if (!player) return;

        try {
            // Call our new Player method
            player.resolveDefuse(game, insertIndex);

            socket.emit('action_resolved', { message: `You successfully hid the Exploding Kitten.` });
            io.to(unifiedRoom).emit('action_resolved', { message: `${player.name} put the Exploding Kitten back in the deck.` });

            // The deck count went up, and the turn changed! Update everyone.
            io.to(unifiedRoom).emit('game_state_update', {
                activeUserId: game.activePlayer.userId,
                topCard: game.discardPile.topCard,
                deckCount: game.drawDeck.deck.length
            });

        } catch (error: any) {
            socket.emit('play_error', { message: error.message });
        }
    });


    /**
     * PLAY CARD. Fired when a player wants to play one or more cards from their hand.
     * 
     * Expects: { roomId: string, cardIds: number[] }
     * 
     * Broadcasts to ALL in the room: player_plays_card — what was played
     * Emits back to THIS player:     see_the_future    — only if See the Future was played
     */
    socket.on('play_card', (data: { roomId: string, cardIds: number[], userId: string }) => {
      const { roomId, cardIds, userId } = data;
      const game = GameManager.getInstance().getGame(roomId);

      if (!game) {
        console.error(`play_card: no active game found for room ${roomId}`);
        return;
      }

      const player = game.playerList.find(p => p.userId === userId);

      if (!player) {
        console.error(`play_card: player ${userId} not found in game ${roomId}`);
        return;
      }

      try {
        const result = player.playSelectedCards(game, cardIds );

            // Broadcast to all players that this player played cards

          io.to(`lobby:${roomId}`).emit('player_plays_cards', {
            playerId: userId,
            playedCards: result.lastPlayedCard, 
          });

        socket.emit('update_hand', { fullHand: player.hand });

        // --- INTERACTIVE ACTIONS (Favor, Combos) ---
        if (result.cardRequest === CardRequestType.Favor || result.cardRequest === CardRequestType.Two_Card_Combo || result.cardRequest === CardRequestType.Three_Card_Combo) {
          // Ask for a target
          socket.emit('action_requires_target', { 
            actionType: result.cardRequest
          });
          io.to(`lobby:${roomId}`).emit('game_state_update', {
          activeUserId: game.activePlayer.userId,
          topCard: result.lastPlayedCard,
          deckCount: game.drawDeck.deck.length
        });
          return; 
        }

        // --- INSTANT ACTIONS (Skip, Shuffle, STF, etc.) ---
        if (result.futureCards) {
          socket.emit('see_the_future', { cards: result.futureCards });
        }

        io.to(`lobby:${roomId}`).emit('game_state_update', {
          activeUserId: game.activePlayer.userId,
          topCard: result.lastPlayedCard,
          deckCount: game.drawDeck.deck.length
        });

      } catch (error) {
        console.error("Server failed to process play_card:", error);
      }
    });

    // PLAYER A SELECTS THE TARGET (AND OPTIONALLY A CARD TYPE)
    socket.on('submit_target', (data: { 
      roomId: string, 
      targetUserId: string, 
      actionType: CardRequestType,
      requestedCardType?: CardType,// Only used for 3-Card Combos
      userId: string
    }) => {
      const { roomId, targetUserId, actionType, requestedCardType, userId } = data;
      const game = GameManager.getInstance().getGame(roomId);
      if (!game) return;

      const sourcePlayer = game.playerList.find(p => p.userId === userId);
      const targetPlayer = game.playerList.find(p => p.userId === targetUserId);
      
      if (!sourcePlayer || !targetPlayer) return;

      // --- HANDLE FAVOR ---
      if (actionType === CardRequestType.Favor) {
        // We must ask the target to pick a card 
        io.in(`lobby:${roomId}`).fetchSockets().then(sockets => {
          const targetSocket = sockets.find(s => s.data.userId === targetPlayer.userId);
          if (targetSocket) {
            targetSocket.emit('request_favor_card', { 
              sourceUserId: sourcePlayer.userId,
              sourcePlayerName: sourcePlayer.name
            });
          }
        });
        return; 
      }

      // --- HANDLE TWO CARD COMBO ---
      if (actionType === CardRequestType.Two_Card_Combo) {
        try {
          // Automatic random steal
          const stolenCard = sourcePlayer.resolveTwoCardCombo(targetPlayer);
          
          updateBothHands(roomId, sourcePlayer, targetPlayer, stolenCard, io, socket);

        } catch (e: any) {
          console.error(e);
        }
        return;
      }

      // --- HANDLE THREE CARD COMBO ---
      if (actionType === CardRequestType.Three_Card_Combo) {
        try {
          if (!requestedCardType) {
            return;
          }

          // Automatic targeted steal!
          const stolenCard = sourcePlayer.resolveThreeCardCombo(targetPlayer, requestedCardType);
          
          if (stolenCard) {
            updateBothHands(roomId, sourcePlayer, targetPlayer, stolenCard, io, socket);
          
          } else {
            // They didn't have the card!
            socket.emit('play_error', { message: `${targetPlayer.name} did not have a ${requestedCardType}.` });
          }
        } catch (e: any) {
          console.error(e);
        }
        return;
      }
    });

    // THE VICTIM SUBMITS THE FAVOR CARD (Only used for Favors)
    socket.on('submit_favor_card', (data: { roomId: string, cardId: number, sourceUserId: string, userId: string }) => {
      const { roomId, cardId, sourceUserId, userId } = data;
      const game = GameManager.getInstance().getGame(roomId);
      if (!game) return;

      // "socket" here is the target, we need to locate the source.
      const targetPlayer = game.playerList.find(p => p.userId === userId);
      const sourcePlayer = game.playerList.find(p => p.userId === sourceUserId);
      
      if (!targetPlayer || !sourcePlayer) return;

      try {
        // Execute the exchange
        const stolenCard = sourcePlayer.resolveFavor(targetPlayer, cardId);

        // Update the Target (Victim) instantly using their own socket
        socket.emit('update_hand', { fullHand: targetPlayer.hand });

        // Search the room to find the Source (Attacker) and update them
        io.in(`lobby:${roomId}`).fetchSockets().then(sockets => {
          const sourceSocket = sockets.find(s => s.data.userId === sourcePlayer.userId);
          
          if (sourceSocket) {
             // Send the attacker their new hand and the stolen card data for animations
             sourceSocket.emit('update_hand', { fullHand: sourcePlayer.hand, stolenCard });
          }
        });

      } catch (error) {
        console.error("Failed to process favor card exchange:", error);
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
   * Helper function to securely update two different clients' hands at the same time
   */
  function updateBothHands(roomId: string, sourcePlayer: any, targetPlayer: any, stolenCard: Card, io: Server, sourceSocket: Socket) {
    // Update Source Player (The one who played the card)
    sourceSocket.emit('update_hand', { fullHand: sourcePlayer.hand, stolenCard });
    
    // Find the Target Player's socket and update them
    io.in(`lobby:${roomId}`).fetchSockets().then(sockets => {
      const targetSocket = sockets.find(s => s.data.userId === targetPlayer.userId);
      console.log("Target Socket for card stealing:", targetSocket);
      if (targetSocket) {
        targetSocket.emit('update_hand', { fullHand: targetPlayer.hand });
      }
    });
  }
}