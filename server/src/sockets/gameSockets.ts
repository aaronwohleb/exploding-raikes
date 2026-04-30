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

  /**
   * Finds a specific player's socket in a room by userId.
   * Returns the first matching RemoteSocket, or undefined.
   */
  async function findPlayerSocket(roomId: string, userId: string) {
    const sockets = await io.in(`lobby:${roomId}`).fetchSockets();
    return sockets.find(s => s.data.userId === userId);
  }

  /**
   * Broadcasts the current game state to everyone in the room.
   */
  function broadcastGameState(roomId: string, game: Game) {
    io.to(`lobby:${roomId}`).emit('game_state_update', {
      activeUserId: game.activePlayer.userId,
      topCard: game.discardPile.pile[game.discardPile.pile.length - 1],
      deckCount: game.drawDeck.deck.length
    });
  }

  /**
   * Helper function to securely update two different clients' hands at the same time.
   */
  async function updateBothHands(roomId: string, sourceUserId: string, sourceHand: Card[], targetUserId: string, targetHand: Card[], stolenCard: Card | null) {
    const sourceSocket = await findPlayerSocket(roomId, sourceUserId);
    if (sourceSocket) {
      sourceSocket.emit('update_hand', { fullHand: sourceHand, stolenCard });
    }
 
    const targetSocket = await findPlayerSocket(roomId, targetUserId);
    if (targetSocket) {
      targetSocket.emit('update_hand', { fullHand: targetHand });
    }
  }

  /**
   * Starts or restarts the 5-second Nope window timer.
   * When the timer fires, it calls game.resolvePendingAction() to handle all game
   * state changes, then emits the appropriate events based on the returned result.
   *
   * Defined outside the connection handler so it doesnt capture any individual
   * socket via closure. It looks up the original player's socket by userId when
   * it needs to emit directly to them.
   */
  function startNopeTimer(roomId: string, game: Game) {
    if (game.nopeTimer) clearTimeout(game.nopeTimer);
 
    game.nopeTimer = setTimeout(async () => {
      // All game logic (nope stack check, effect execution, discarding, cleanup)
      // is handled inside Game.resolvePendingAction()
      const result = game.resolvePendingAction();
      if (!result) return;
 
      if (result.noped) {
        io.to(`lobby:${roomId}`).emit('action_resolved', { message: "The action was NOPED!" });
        return;
      }
 
      // --- FAVOR RESOLVED (target must now choose a card to give) ---
      if (result.pendingFavor) {
        const targetSocket = await findPlayerSocket(roomId, result.pendingFavor.targetUserId);
        if (targetSocket) {
          targetSocket.emit('request_favor_card', {
            sourceUserId: result.pendingFavor.sourceUserId,
            sourcePlayerName: result.pendingFavor.sourcePlayerName,
          });
        }
        broadcastGameState(roomId, game);
        return;
      }
 
      // --- 2/3-CARD COMBO  ---
      if (result.comboResult) {
        const { sourcePlayerId, targetUserId, stolenCard, requestedType } = result.comboResult;
        const sourcePlayer = game.playerList.find(p => p.userId === sourcePlayerId);
        const targetPlayer = game.playerList.find(p => p.userId === targetUserId);
 
        if (sourcePlayer && targetPlayer) {
          if (stolenCard) {
            await updateBothHands(roomId, sourcePlayerId, sourcePlayer.hand, targetUserId, targetPlayer.hand, stolenCard);
          } else {
            // 3-card combo: target didn't have the requested type
            const sourceSocket = await findPlayerSocket(roomId, sourcePlayerId);
            if (sourceSocket) {
              sourceSocket.emit('play_error', { message: `${targetPlayer.name} did not have a ${requestedType}.` });
            }
          }
        }
 
        broadcastGameState(roomId, game);
        return;
      }
 
      // --- NON-TARGETED RESOLUTION (Attack, Skip, Shuffle, 5-card combo) ---
      const playerSocket = await findPlayerSocket(roomId, result.sourcePlayerId);
 
      if (result.futureCards && playerSocket) {
        playerSocket.emit('see_the_future', { cards: result.futureCards });
      }
 
      if (result.cardRequest && playerSocket) {
        // 5-card combo: send the player the available card types from the discard pile to choose from
        playerSocket.emit('action_requires_target', { 
          requestType: result.cardRequest,
          availableDiscardTypes: result.availableDiscardTypes,
        });
      }
 
      broadcastGameState(roomId, game);
    }, 5000);
  }

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
        broadcastGameState(roomId, game);
        
        console.log(`Sent initial game state to ${player.name}`);
      }
    });
    
    /**
     * Draw Card. Fired when a player wants to draw a card, ending their turn.
     * * Expects: { roomId: string, userId: string }
     * * Emits back to THIS player:      update_hand      — their updated hand
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
             socket.emit('update_hand', { fullHand: player.hand });
             io.to(`lobby:${roomId}`).emit('game_state_update', {
                 activeUserId: game.activePlayer.userId,
                 topCard: result.drawnCard,
                 deckCount: game.drawDeck.deck.length
             });

             // player that exploded; tells entire room who exploded
             io.to(`lobby:${roomId}`).emit('player_exploded', { playerId: userId, playerName: player.name });

             // tells entire room the game is over
             if (game.playerList.length === 1) {
                io.to(`lobby:${roomId}`).emit('game_over', { 
                    winnerId: game.playerList[0].userId, 
                    winnerName: game.playerList[0].name 
                });
            } else if (game.playerList.length === 0) {
                io.to(`lobby:${roomId}`).emit('game_over', { 
                    winnerId: null, 
                    winnerName: 'Nobody' 
                });
            }

            return;
        }

        if (result.defusePending) {
             console.log(`${player.name} is attempting to defuse an exploding kauffman! Waiting for slider input...`);
             socket.emit('update_hand', { fullHand: player.hand }); // Updates UI to show Defuse is gone
             
             // Tell the frontend to pop up the slider
             socket.emit('defuse_requires_index', { maxIndex: game.drawDeck.deck.length });

             io.to(`lobby:${roomId}`).emit('action_resolved', { message: `${player.name} drew an Exploding Kauffman and is DEFUSING IT!` });
             return;
        }

        socket.emit('update_hand', { fullHand: player.hand, justDrawnCard: result.drawnCard });

        io.to(`lobby:${roomId}`).emit('player_draws_card', {
          playerId: userId,
          deckCount: game.drawDeck.deck.length
        });

        broadcastGameState(roomId, game);

        console.log(`draw_card: player ${userId} drew a card in room ${roomId}`);
      } catch (error: any) {
        // Catch the "Not your turn" error thrown by Player.ts
        socket.emit('play_error', { message: error.message });
      }
    });

    /**
     * Play Card. Initiates the Nope timer window.
     */
    socket.on('play_card', (data: { roomId: string, userId: string, cardIds: number[] }) => {
      const { roomId, userId, cardIds } = data;
      const game = GameManager.getInstance().getGame(roomId);
      if (!game) return;

      const player = game.playerList.find(p => p.userId === userId);
      if (!player) return;

      // Turn validation: only the active player may play cards
      if (game.activePlayer !== player) {
        socket.emit('play_error', { message: "It is not your turn!" });
        return;
      }

      
      const selectedCards = player.hand.filter(c => cardIds.includes(c.id));
      if (selectedCards.length !== cardIds.length) {
        socket.emit('play_error', { message: "One or more selected cards were not found in your hand." });
        return;
      }
      
      player.selectedCards = selectedCards;
      if (!player.checkMove()) {
          socket.emit('play_error', { message: "Invalid move!" });
          return;
      }

      const setupResult = game.beginCardPlay(player, player.selectedCards);
      socket.emit('update_hand', { fullHand: player.hand });

      if (setupResult.requiresTarget) {
        // --- TARGETED PLAY: ask the player to select a target BEFORE announcing ---
        // The play is held until submit_target is received.
        socket.emit('action_requires_target', { requestType: setupResult.cardRequest });
        console.log(`play_card: ${player.name} played a targeted card, waiting for target selection...`);
      } else {
        // --- NON-TARGETED PLAY: announce immediately and start the Nope timer ---
        io.to(`lobby:${roomId}`).emit('player_plays_card', { playerId: userId, cards: player.selectedCards });
        startNopeTimer(roomId, game);
        console.log(`play_card: ${player.name} played cards, nope window opened.`);
      }
    });

    /**
     * Play Nope. Resets the 5-second timer.
     */
    socket.on('play_nope', (data: { roomId: string, userId: string, cardId: number }) => {
      const { roomId, userId, cardId } = data;
      const game = GameManager.getInstance().getGame(roomId);
      if (!game || !game.pendingAction) return;

      const player = game.playerList.find(p => p.userId === userId);
      if (!player) return;

      const nopeCard = player.hand.find(c => c.id === cardId && c.type === CardType.Nope);
      if (!nopeCard) return;

      // Use the card
      game.playNope(player, nopeCard);
      
      socket.emit('update_hand', { fullHand: player.hand });
      io.to(`lobby:${roomId}`).emit('player_plays_card', { playerId: userId, cards: [nopeCard] });
 
      // Reset the 5-second Nope window
      startNopeTimer(roomId, game);
    });


    socket.on('submit_defuse_location', (data: { roomId: string, userId: string, insertIndex: number }) => {
      const { roomId, userId, insertIndex } = data;
      const game = GameManager.getInstance().getGame(roomId);
      if (!game) return;
      const player = game.playerList.find(p => p.userId === userId);
      if (!player) return;

      try {
        player.resolveDefuse(game, insertIndex);
        broadcastGameState(roomId, game);
      } catch (error: any) {
        socket.emit('play_error', { message: error.message });
      }
    });

    // PLAYER A SELECTS THE TARGET (AND OPTIONALLY A CARD TYPE)
    socket.on('submit_target', (data: { 
      roomId: string, 
      userId: string,
      targetUserId: string, 
      requestedCardType?: CardType, // Only used for 3-Card Combos
    }) => {
      const { roomId, userId, targetUserId, requestedCardType } = data;
      const game = GameManager.getInstance().getGame(roomId);
      if (!game||!game.pendingAction) return;

      if (game.pendingAction.playerId !== userId) {
        socket.emit('play_error', { message: "This is not your pending action." });
        return;
      }
      const targetPlayer = game.playerList.find(p => p.userId === targetUserId);
      if (!targetPlayer) {
        socket.emit('play_error', { message: "Target player not found." });
        return;
      }
 
      // 3-card combos require a requested card type
      if (game.pendingAction.actionType === CardRequestType.Three_Card_Combo && !requestedCardType) {
        socket.emit('play_error', { message: "You must specify a card type for a 3-card combo." });
        return;
      }
 
      // Store the target on the pending action
      game.setTarget(targetUserId, requestedCardType);
 
      // NOW announce the full play to the room — everyone can see who is being targeted
      io.to(`lobby:${roomId}`).emit('player_plays_card', { 
        playerId: userId, 
        cards: game.pendingAction.cards, 
        targetPlayerId: targetUserId,
        targetPlayerName: targetPlayer.name,
        actionType: game.pendingAction.actionType,
        requestedCardType: requestedCardType,
      });
 
      // Start the 5-second Nope window
      startNopeTimer(roomId, game);
      console.log(`submit_target: ${userId} targets ${targetPlayer.name}, nope window opened.`);
    });

    /**
     * Submit Five Card Choice. Player picks a card from the discard pile after a 5-card combo resolves.
     */
    socket.on('submit_five_card_choice', (data: { roomId: string, userId: string, cardType: CardType }) => {
      const { roomId, userId, cardType } = data;
      const game = GameManager.getInstance().getGame(roomId);
      if (!game) return;
 
      const player = game.playerList.find(p => p.userId === userId);
      if (!player) return;
 
      try {
        const chosenCard = player.resolveFiveCardCombo(game, cardType);
        socket.emit('update_hand', { fullHand: player.hand, stolenCard: chosenCard });
        broadcastGameState(roomId, game);
      } catch (error: any) {
        socket.emit('play_error', { message: error.message });
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
        findPlayerSocket(roomId, sourcePlayer.userId).then(sourceSocket => {
          if (sourceSocket) {
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

}