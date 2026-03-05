import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useGameSocket } from './SocketContext';
import { FrontendCard, PlayedCard, GameState } from '../types/types';

/**
 * Describes the shape of the GameContext value available to any component inside GameProvider.
 */
interface GameContextType {
  myHand: FrontendCard[];
  lastPlayedCard: PlayedCard | null;
  // Only populated after playing See the Future.
  seeTheFutureCards: FrontendCard[];
  // Emits a draw_card event to the server.
  drawCard: (roomId: string) => void;
  // Emits a play_card event to the server with the selected cards.
  playCard: (roomId: string, cards: FrontendCard[]) => void;
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

  const [myHand, setMyHand] = useState<FrontendCard[]>([]);
  const [lastPlayedCard, setLastPlayedCard] = useState<PlayedCard | null>(null);
  const [seeTheFutureCards, setSeeTheFutureCards] = useState<FrontendCard[]>([]);

  // listeners

  useEffect(() => {
    if (!socket) return;

    /**
     * Fired by the server to send THIS player their current hand.
     * Only sent to the player who drew — not to everyone.
     */
    const handleReceiveCard = (hand: FrontendCard[]) => {
      console.log('receive_card (full hand):', hand);
      setMyHand(hand);
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
    const handlePlayerPlaysCard = (playedCard: PlayedCard) => {
      console.log('player_plays_card:', playedCard);
      setLastPlayedCard(playedCard);
    };

    /**
     * Fired ONLY to the player who played a See the Future card.
     * Contains the top 3 cards of the draw deck in order.
     */
    const handleSeeTheFuture = (topCards: FrontendCard[]) => {
      console.log('see_the_future — top 3 cards:', topCards);
      setSeeTheFutureCards(topCards);
    };

    // Turn the listeners on
    socket.on('receive_card', handleReceiveCard);
    socket.on('player_draws_card', handlePlayerDrawsCard);
    socket.on('player_plays_card', handlePlayerPlaysCard);
    socket.on('see_the_future', handleSeeTheFuture);

    // Turn the listeners off
    return () => {
      socket.off('receive_card', handleReceiveCard);
      socket.off('player_draws_card', handlePlayerDrawsCard);
      socket.off('player_plays_card', handlePlayerPlaysCard);
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
 const playCard = (roomId: string, cardIds: number[]) => {
    if (!socket) return;
    socket.emit('play_card', { roomId, cardIds });
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



