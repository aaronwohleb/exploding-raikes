import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { useGameSocket } from './SocketContext';
import { Card, CardRequestType, CardType, GameState, NopeWindowState } from '../types/types';
import { useAuth } from './AuthContext'; 

interface GameContextType {
  myHand: Card[];
  lastPlayedCard: Card | null;
  // Only populated after playing See the Future.
  seeTheFutureCards: Card[];
  closeSeeTheFuture: () => void;

  deckCount: number;
  activeUserId: string;

  actionRequiresTarget: CardRequestType | null;
  favorRequest: { sourceUserId: string, sourcePlayerName: string } | null;

  nopeWindow: NopeWindowState | null;
  fiveCardComboTypes: CardType[] | null;

  actionMessage: string | null;
  playError: string | null;

  requestInitialState: (roomId: string, userId: string) => void;

  explodedPlayerId: string | null;
  gameOver: { winnerId: string, winnerName: string } | null;
  dismissExplosion: () => void;

  // EMITTERS 
  drawCard: (roomId: string) => void;
  playCard: (roomId: string, cardIds: number[]) => void;
  playNope: (roomId: string) => void;

  submitTarget: (roomId: string, targetUserId: string, actionType: CardRequestType, requestedCardType?: CardType) => void;
  submitFavorCard: (roomId: string, cardId: number, sourceUserId: string) => void;
  submitFiveCardChoice: (roomId: string, cardType: CardType) => void;


  defuseRequest: { maxIndex: number } | null;
  submitDefuseLocation: (roomId: string, insertIndex: number) => void;
  eliminatedPlayerIds: string[];
  explosionNotification: string | null;
  cardAnimQueue: CardAnimTrigger[];
  shiftCardAnim: () => void;
  playerHandCounts: Record<string, number>;
}

export type CardAnimTrigger =
  | { type: 'my_draw'; card: Card }
  | { type: 'my_receive'; card: Card; fromPlayerId?: string }
  | { type: 'opponent_draw'; playerId: string }
  | { type: 'player_play'; playerId: string; cards: Card[] };

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const { socket } = useGameSocket();
  const { currentFrontendUser } = useAuth();

  const [myHand, setMyHand] = useState<Card[]>([]);
  const [lastPlayedCard, setLastPlayedCard] = useState<Card | null>(null);
  const [seeTheFutureCards, setSeeTheFutureCards] = useState<Card[]>([]);
  const [defuseRequest, setDefuseRequest] = useState<{ maxIndex: number } | null>(null);
  const closeSeeTheFuture = () => {
    setSeeTheFutureCards([]);
  };

  const [deckCount, setDeckCount] = useState<number>(0);
  const [activeUserId, setActiveUserId] = useState<string>('');

  const [actionRequiresTarget, setActionRequiresTarget] = useState<CardRequestType | null>(null);
  const [favorRequest, setFavorRequest] = useState<{ sourceUserId: string, sourcePlayerName: string } | null>(null);
  
  const [explodedPlayerId, setExplodedPlayerId] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState<{ winnerId: string, winnerName: string } | null>(null);
  const dismissExplosion = () => setExplodedPlayerId(null);
  const [eliminatedPlayerIds, setEliminatedPlayerIds] = useState<string[]>([]);
  const [explosionNotification, setExplosionNotification] = useState<string | null>(null);

  const [playerHandCounts, setPlayerHandCounts] = useState<Record<string, number>>({});
  const [cardAnimQueue, setCardAnimQueue] = useState<CardAnimTrigger[]>([]);
  const myHandTrackerRef = useRef<Card[]>([]);
  const lastStealerIdRef = useRef<string | null>(null);
  const pushAnim = (trigger: CardAnimTrigger) =>
    setCardAnimQueue(prev => [...prev, trigger]);
  const shiftCardAnim = useCallback(
    () => setCardAnimQueue(prev => prev.slice(1)),
    []
  );

  const [nopeWindow, setNopeWindow] = useState<NopeWindowState | null>(null);
  const nopeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
 
  // Five-card combo state — the available card types from the discard pile
  const [fiveCardComboTypes, setFiveCardComboTypes] = useState<CardType[] | null>(null);
 
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [playError, setPlayError] = useState<string | null>(null);
  const requestInitialState = (roomId: string, userId: string) => {
    if (!socket) return;
    socket.emit('request_initial_state', { roomId, userId });
    // Reset game over state for new sessions
    setGameOver(null);
    setExplodedPlayerId(null);
    setEliminatedPlayerIds([]);
    setExplosionNotification(null);
    setLastPlayedCard(null);
    };



  /**
   * Starts or restarts the visual nope window timer on the frontend.
   * Slightly longer than the backend's 5s to avoid the UI closing before resolution arrives.
   */
  function resetNopeWindowTimer() {
    if (nopeTimerRef.current) clearTimeout(nopeTimerRef.current);
    nopeTimerRef.current = setTimeout(() => {
      setNopeWindow(null);
    }, 6000);
  }

  // listeners

  useEffect(() => {
    if (!socket) return;

    /**
     * Fired by the server to send THIS player their current hand.
     * Only sent to the player who drew — not to everyone.
     */
    const handleUpdateHand = (data: { fullHand: Card[], justDrawnCard?: Card | null }) => {
      const prevHand = myHandTrackerRef.current;
      setMyHand(data.fullHand);
      myHandTrackerRef.current = data.fullHand;
      if (data.justDrawnCard) {
        pushAnim({ type: 'my_draw', card: data.justDrawnCard });
      } else {
        const newCards = data.fullHand.filter(c => !prevHand.some(p => p.id === c.id));
        const fromPlayerId = lastStealerIdRef.current ?? undefined;
        lastStealerIdRef.current = null;
        newCards.forEach(card => pushAnim({ type: 'my_receive', card, fromPlayerId }));
      }
    };

    /**
     * Broadcast to ALL players when any player draws a card.
     */
    const handlePlayerDrawsCard = (data: { playerId: string, deckCount: number }) => {
      setDeckCount(data.deckCount);
      if (data.playerId !== currentFrontendUser?._id) {
        pushAnim({ type: 'opponent_draw', playerId: data.playerId });
      }
    };

    const handleDefuseRequiresIndex = (data: { maxIndex: number }) => {
        setDefuseRequest(data);
    };

    /**
     * Broadcast to ALL players when any player plays a card.
     */
    const handlePlayerPlaysCard = (data: { 
      playerId: string, 
      cards: Card[], 
      targetPlayerId?: string, 
      targetPlayerName?: string,
      actionType?: CardRequestType,
    }) => {
      if (
        data.targetPlayerId === currentFrontendUser?._id &&
        (data.actionType === CardRequestType.Favor ||
         data.actionType === CardRequestType.Two_Card_Combo ||
         data.actionType === CardRequestType.Three_Card_Combo)
      ) {
        lastStealerIdRef.current = data.playerId;
      }

      const staggerDelay = Math.max(0, data.cards.length - 1) * 120;
      setTimeout(() => setLastPlayedCard(data.cards[data.cards.length - 1]), 450 + staggerDelay + 50);

      // Open/restart the Nope window
      setNopeWindow({
        playerId: data.playerId,
        cards: data.cards,
        targetPlayerName: data.targetPlayerName,
        actionType: data.actionType,
        startedAt: Date.now(),
      });
      resetNopeWindowTimer();
      pushAnim({ type: 'player_play', playerId: data.playerId, cards: data.cards });
    };

    /**
     * Fired ONLY to the player who played a See the Future card.
     * Contains the top 3 cards of the draw deck in order.
     */
    const handleSeeTheFuture = (data: {cards: Card[]}) => {
      setSeeTheFutureCards(data.cards);
      setNopeWindow(null);
    };

    /**
     * Generalized game state update broadcasted to all users
     */
    const handleGameStateUpdate = (data: { activeUserId: string, topCard: Card, deckCount: number, playerHandCounts?: Record<string, number> }) => {
      setActiveUserId(data.activeUserId);
      if (data.topCard) {
        setLastPlayedCard(data.topCard);
      }
      setDeckCount(data.deckCount);
      if (data.playerHandCounts) {
        setPlayerHandCounts(data.playerHandCounts);
      }
    };

    // --- INTERACTIVE ACTION LISTENERS ---

    const handleActionRequiresTarget = (data: { requestType: CardRequestType, availableDiscardTypes?: CardType[] }) => {
      if (data.requestType === CardRequestType.Five_Card_Combo && data.availableDiscardTypes) {
        setFiveCardComboTypes(data.availableDiscardTypes);
        setNopeWindow(null);
      } else {
        setActionRequiresTarget(data.requestType);
      }
    };

    const handleRequestFavorCard = (data: { sourceUserId: string, sourcePlayerName: string }) => {
      setFavorRequest(data);
      setNopeWindow(null);
    };

     /**
     * Fired to all players when an action resolves with a message.
     */
    const handleActionResolved = (data: { message: string }) => {
      setActionMessage(data.message);
      // Auto-dismiss after 3 seconds
      setNopeWindow(null);
      setTimeout(() => setActionMessage(null), 3000);
    };
 
    /**
     * Fired to a specific player when they attempt an invalid action.
     */

    const handlePlayError = (data: { message: string }) => {
      setPlayError(data.message);
      setTimeout(() => setPlayError(null), 3000);
    };

    socket.on('update_hand', handleUpdateHand);
    socket.on('player_draws_card', handlePlayerDrawsCard);
    socket.on('defuse_requires_index', handleDefuseRequiresIndex);
    socket.on('player_plays_card', handlePlayerPlaysCard);
    socket.on('see_the_future', handleSeeTheFuture);
    socket.on('game_state_update', handleGameStateUpdate);

    socket.on('action_requires_target', handleActionRequiresTarget);
    socket.on('request_favor_card', handleRequestFavorCard);
    socket.on('action_resolved', handleActionResolved);
    socket.on('play_error', handlePlayError);

    socket.on('player_exploded', ({ playerId, playerName }: { playerId: string, playerName: string }) => {
      setExplodedPlayerId(playerId);
      setEliminatedPlayerIds(prev => [...prev, playerId]);
      setExplosionNotification(`💥 ${playerName} exploded!`);
      setTimeout(() => setExplosionNotification(null), 3000);
  });
    socket.on('game_over', (data: { winnerId: string, winnerName: string }) => setGameOver(data));

    return () => {
      socket.off('update_hand', handleUpdateHand);
      socket.off('player_draws_card', handlePlayerDrawsCard);
      socket.off('defuse_requires_index', handleDefuseRequiresIndex);
      socket.off('player_plays_card', handlePlayerPlaysCard);
      socket.off('see_the_future', handleSeeTheFuture);
      socket.off('game_state_update', handleGameStateUpdate);

      socket.off('action_requires_target', handleActionRequiresTarget);
      socket.off('request_favor_card', handleRequestFavorCard);

      socket.off('player_exploded');
      socket.off('game_over');

      socket.off('action_resolved', handleActionResolved);
      socket.off('play_error', handlePlayError);

      if (nopeTimerRef.current) clearTimeout(nopeTimerRef.current);
    };
  }, [socket]);

  // emitters 

  /**
   * Emits a `draw_card` event to the server, signaling the player wants to draw.
   * The server responds with `receive_card` to this player and
   * `player_draws_card` broadcast to all players in the room.
   *
   * @param roomId - The ID of the room/game the player is in.
   */
  const drawCard = (roomId: string) => {
    if (!socket) return;
    socket.emit('draw_card', { roomId, userId: currentFrontendUser?._id });
  };

  const submitDefuseLocation = (roomId: string, insertIndex: number) => {
    if (!socket || !currentFrontendUser) return;
    socket.emit('submit_defuse_location', { roomId, userId: currentFrontendUser._id, insertIndex });
    setDefuseRequest(null); // Close the modal
  };

  /**
   * Emits a `play_card` event to the server with the selected cards.
   * Supports single-card plays and multi-card plays 
   * The server validates the play and broadcasts `player_plays_card` to all players in the room.
   *
   * @param roomId - The ID of the room/game the player is in.
   * @param cardIds - The IDs of the cards the player wants to play from their hand.
   */
  const playCard = (roomId: string, cardIds: number[]) => {
    if (!socket) return;

    socket.emit('play_card', { roomId, cardIds, userId: currentFrontendUser?._id });
  };

  /**
   * Emits a `play_nope` event to the server using the first Nope card in the player's hand.
   */
  const playNope = (roomId: string) => {
    if (!socket || !currentFrontendUser) return;
 
    const nopeCard = myHand.find(c => c.type === CardType.Nope);
    if (!nopeCard) return;
 
    socket.emit('play_nope', { roomId, userId: currentFrontendUser._id, cardId: nopeCard.id });
  };

  /**
   * Called by the UI after the user selects a target from the modal popup.
   */
  const submitTarget = (roomId: string, targetUserId: string, actionType: CardRequestType, requestedCardType?: CardType) => {
    if (!socket) return;
    socket.emit('submit_target', { roomId, targetUserId, requestedCardType, userId: currentFrontendUser?._id });
    setActionRequiresTarget(null); // Close the target selection modal
  };

  /**
   * Called by the UI after the victim selects a card to give up for a Favor.
   */
  const submitFavorCard = (roomId: string, cardId: number, sourceUserId: string) => {
    if (!socket) return;
    socket.emit('submit_favor_card', { roomId, cardId, sourceUserId, userId: currentFrontendUser?._id });
    setFavorRequest(null);
  };

  /**
   * Called by the UI after the player picks a card type from the discard pile for a 5-card combo.
   */
  const submitFiveCardChoice = (roomId: string, cardType: CardType) => {
    if (!socket) return;
    socket.emit('submit_five_card_choice', { roomId, userId: currentFrontendUser?._id, cardType });
    setFiveCardComboTypes(null);
  };

  return (
    <GameContext.Provider value={{ 
      myHand, 
      lastPlayedCard, 
      seeTheFutureCards,
      closeSeeTheFuture,
      deckCount,
      activeUserId,
      actionRequiresTarget,
      favorRequest,
      nopeWindow,
      fiveCardComboTypes,
      actionMessage,
      playError,
      defuseRequest,
      submitDefuseLocation,
      drawCard, 
      playCard,
      playNope,
      submitTarget,
      submitFavorCard,
      submitFiveCardChoice,
      requestInitialState,
      explodedPlayerId,
      gameOver,
      dismissExplosion,
      eliminatedPlayerIds,
      explosionNotification,
      cardAnimQueue,
      shiftCardAnim,
      playerHandCounts,
    }}>
      {children}
    </GameContext.Provider>
  );
}


export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
};



