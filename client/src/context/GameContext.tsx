import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useGameSocket } from './SocketContext';
import { Card, CardRequestType, CardType, GameState } from '../types/types';
import { useAuth } from './AuthContext'; 

/**
 * Describes the shape of the GameContext value available to any component inside GameProvider.
 */
interface GameContextType {
  myHand: Card[];
  lastPlayedCard: Card | null;
  // Only populated after playing See the Future.
  seeTheFutureCards: Card[];
  closeSeeTheFuture: () => void; // Function to close the See the Future view

  deckCount: number;
  activeUserId: string;

  // If not null, the UI should prompt the user to pick a target player
  actionRequiresTarget: CardRequestType | null;
  // If not null, the UI should prompt the user to pick a card to give away
  favorRequest: { sourceUserId: string, sourcePlayerName: string } | null;

  requestInitialState: (roomId: string, userId: string) => void;

  // EMITTERS 
  // Emits a draw_card event to the server.
  drawCard: (roomId: string) => void;
  // Emits a play_card event to the server with the selected cards.
  playCard: (roomId: string, cardIds: number[], targetPlayerId?: string) => void;
  submitTarget: (roomId: string, targetUserId: string, actionType: CardRequestType, requestedCardType?: CardType) => void;
  submitFavorCard: (roomId: string, cardId: number, sourceUserId: string) => void;

  defuseRequest: { maxIndex: number } | null;
  submitDefuseLocation: (roomId: string, insertIndex: number) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

/**
 * Wraps the game UI and provides game socket events and actions to all child components.
 * Handles listeners in a useEffect and exposes emitters as functions.
 *
 * @param children - React children that will have access to this context.
 */
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
  const requestInitialState = (roomId: string, userId: string) => {
    if (!socket) return;
    socket.emit('request_initial_state', { roomId, userId });
    };
  // listeners

  useEffect(() => {
    if (!socket) return;

    /**
     * Fired by the server to send THIS player their current hand.
     * Only sent to the player who drew — not to everyone.
     */
    const handleUpdateHand = (data: { fullHand: Card[], justDrawnCard?: Card | null }) => {
      console.log('drawn_card :', data.justDrawnCard);
      console.log('full hand:', data.fullHand);
      setMyHand(data.fullHand);
      // TODO: trigger animation for justDrawnCard if not null
    };

    /**
     * Broadcast to ALL players when any player draws a card.
     * Contains only who drew — card details stay private via receive_card.
     */
    const handlePlayerDrawsCard = (data: { playerId: string, deckCount: number }) => {
      console.log('player_draws_card:', data.playerId);
      setDeckCount(data.deckCount);
      // TODO: animate who drew card?
    };

    const handleDefuseRequiresIndex = (data: { maxIndex: number }) => {
        setDefuseRequest(data);
    };

    /**
     * Broadcast to ALL players when any player plays a card.
     * Contains the card type and all cards involved so every player can see what was played.
     */
    const handlePlayerPlaysCards = (data: {playedCards: Card[], playerId: string }) => {
      console.log('player' + data.playerId + '_plays_cards:', data.playedCards);
    };

    /**
     * Fired ONLY to the player who played a See the Future card.
     * Contains the top 3 cards of the draw deck in order.
     */
    const handleSeeTheFuture = (data: {cards: Card[]}) => {
      console.log('see_the_future — top 3 cards:', data.cards);
      setSeeTheFutureCards(data.cards);
    };

    /**
     * Generalized game state update broadcasted to all users
     */
    const handleGameStateUpdate = (data: { activeUserId: string, topCard: Card, deckCount: number }) => {
      setActiveUserId(data.activeUserId);
      if (data.topCard) {
        setLastPlayedCard(data.topCard);
      }
      setDeckCount(data.deckCount);
    };

    // --- INTERACTIVE ACTION LISTENERS ---

    const handleActionRequiresTarget = (data: { actionType: CardRequestType }) => {
      console.log("Action requires target!", data.actionType);
      setActionRequiresTarget(data.actionType); // Pops up target selection modal
    };

    const handleRequestFavorCard = (data: { sourceUserId: string, sourcePlayerName: string }) => {
      console.log("Someone wants a favor!", data);
      setFavorRequest(data); // Pops up favor card selection modal
    };

    // Turn the listeners on
    socket.on('update_hand', handleUpdateHand);
    socket.on('player_draws_card', handlePlayerDrawsCard);
    socket.on('defuse_requires_index', handleDefuseRequiresIndex);
    socket.on('player_plays_cards', handlePlayerPlaysCards);
    socket.on('see_the_future', handleSeeTheFuture);
    socket.on('game_state_update', handleGameStateUpdate);

    socket.on('action_requires_target', handleActionRequiresTarget);
    socket.on('request_favor_card', handleRequestFavorCard);

    // Turn the listeners off
    return () => {
      socket.off('update_hand', handleUpdateHand);
      socket.off('player_draws_card', handlePlayerDrawsCard);
      socket.off('defuse_requires_index', handleDefuseRequiresIndex);
      socket.off('player_plays_cards', handlePlayerPlaysCards);
      socket.off('see_the_future', handleSeeTheFuture);
      socket.off('game_state_update', handleGameStateUpdate);

      socket.off('action_requires_target', handleActionRequiresTarget);
      socket.off('request_favor_card', handleRequestFavorCard);
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
   * Called by the UI after the user selects a target from the modal popup.
   */
  const submitTarget = (roomId: string, targetUserId: string, actionType: CardRequestType, requestedCardType?: CardType) => {
    if (!socket) return;
    socket.emit('submit_target', { roomId, targetUserId, actionType, requestedCardType, userId: currentFrontendUser?._id });
    setActionRequiresTarget(null); // Close the target modal
  };

  /**
   * Called by the UI after the victim selects a card to give up for a Favor.
   */
  const submitFavorCard = (roomId: string, cardId: number, sourceUserId: string) => {
    if (!socket) return;
    socket.emit('submit_favor_card', { roomId, cardId, sourceUserId, userId: currentFrontendUser?._id });
    setFavorRequest(null); // Close the favor modal
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
      defuseRequest,
      submitDefuseLocation,
      drawCard, 
      playCard,
      submitTarget,
      submitFavorCard,
      requestInitialState,
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



