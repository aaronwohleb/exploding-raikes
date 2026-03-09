import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useGameSocket } from './SocketContext';
import { Card, GameState } from '../types/types';

/**
 * Describes the shape of the GameContext value available to any component inside GameProvider.
 */
interface GameContextType {
  myHand: Card[];
  lastPlayedCard: Card | null;
  // Only populated after playing See the Future.
  seeTheFutureCards: Card[];
  // Emits a draw_card event to the server.
  drawCard: (roomId: string) => void;
  // Emits a play_card event to the server with the selected cards.
  playCard: (roomId: string, cards: number[], targetPlayerId?: string) => void;
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

  const [myHand, setMyHand] = useState<Card[]>([]);
  const [lastPlayedCard, setLastPlayedCard] = useState<Card | null>(null);
  const [seeTheFutureCards, setSeeTheFutureCards] = useState<Card[]>([]);

  // listeners

  useEffect(() => {
    if (!socket) return;

    /**
     * Fired by the server to send THIS player their current hand.
     * Only sent to the player who drew — not to everyone.
     */
    const handleUpdateHand = (data: { fullHand: Card[], justDrawnCard: Card | null }) => {
      console.log('drawn_card :', data.justDrawnCard);
      console.log('full hand:', data.fullHand);
      setMyHand(data.fullHand);
      // TODO: trigger animation for justDrawnCard if not null
    };

    /**
     * Broadcast to ALL players when any player draws a card.
     * Contains only who drew — card details stay private via receive_card.
     */
    const handlePlayerDrawsCard = (data: { playerId: string }) => {
      console.log('player_draws_card:', data.playerId);
      // TODO: animate who drew card?
    };

    /**
     * Broadcast to ALL players when any player plays a card.
     * Contains the card type and all cards involved so every player can see what was played.
     */
    const handlePlayerPlaysCards = (data: {playedCards: Card[], playerId: string }) => {
      console.log('player' + data.playerId + '_plays_cards:', data.playedCards);
      setLastPlayedCard(data.playedCards[data.playedCards.length - 1]);
    };

    /**
     * Fired ONLY to the player who played a See the Future card.
     * Contains the top 3 cards of the draw deck in order.
     */
    const handleSeeTheFuture = (topCards: Card[]) => {
      console.log('see_the_future — top 3 cards:', topCards);
      setSeeTheFutureCards(topCards);
    };

    // Turn the listeners on
    socket.on('update_hand', handleUpdateHand);
    socket.on('player_draws_card', handlePlayerDrawsCard);
    socket.on('player_plays_cards', handlePlayerPlaysCards);
    socket.on('see_the_future', handleSeeTheFuture);

    // Turn the listeners off
    return () => {
      socket.off('update_hand', handleUpdateHand);
      socket.off('player_draws_card', handlePlayerDrawsCard);
      socket.off('player_plays_cards', handlePlayerPlaysCards);
      socket.off('see_the_future', handleSeeTheFuture);
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
    socket.emit('draw_card', { roomId });
  };

  /**
   * Emits a `play_card` event to the server with the selected cards.
   * Supports single-card plays and multi-card plays 
   * The server validates the play and broadcasts `player_plays_card` to all players in the room.
   *
   * @param roomId - The ID of the room/game the player is in.
   * @param cards - The cards the player wants to play from their hand.
   */
 const playCard = (roomId: string, cardIds: number[], targetPlayerId?: string) => {
    if (!socket) return;
    socket.emit('play_card', { roomId, cardIds, targetPlayerId });
  };

  return (
    <GameContext.Provider value={{ myHand, lastPlayedCard, seeTheFutureCards, drawCard, playCard }}>
      {children}
    </GameContext.Provider>
  );
}


export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
};



