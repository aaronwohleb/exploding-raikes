import React, { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useGame } from "../context/GameContext";
import { useAuth } from "../context/AuthContext";
import { useLobby } from "../context/LobbyContext";
import { AnimatePresence, motion } from "framer-motion";
import CardBack from "./CardBack";
import CardFront from "./CardFront";
import Deck from "./Deck";

export default function InGameScreen() {
  const { myHand, lastPlayedCard, drawCard, playCard } = useGame();
  const { currentLobby } = useLobby();
  const { currentFrontendUser } = useAuth();
  const params = useParams();
  
  // Get roomId from URL params or from currentLobby
  const roomId = params.roomId || currentLobby?.code || "ROOM_ID";
  
  // Log to debug
  useEffect(() => {
    console.log("Current myHand:", myHand);
    console.log("Room ID:", roomId);
    console.log("Current Lobby:", currentLobby);
  }, [myHand, roomId, currentLobby]);

  // You'd get these from your game state/context
  const deckSize = 40; // Replace with actual deck size from game state
  
  // Create opponent hands based on lobby players (excluding current user)
  const opponentHands = currentLobby?.players
    .filter(player => player._id !== currentFrontendUser?._id)
    .map(player => ({
      playerId: player.username || player._id,
      cardCount: 5 // Replace with actual hand sizes from game state
    })) || [];

  return (
    <div className="relative w-full h-screen bg-green-800 text-white">

      {/* CENTER BOARD */}
      <div className="absolute inset-0 flex items-center justify-center gap-20">

        {/* Last played card */}
        <div className="w-24 h-32">
          {lastPlayedCard ? (
            <CardFront 
              card={lastPlayedCard} 
              animate={false}
              className="w-full h-full"
            />
          ) : (
            <div className="w-full h-full bg-amber-800/50 rounded-lg border-2 border-amber-600/50 flex items-center justify-center text-sm">
              Discard
            </div>
          )}
        </div>

        {/* Draw Deck */}
        <Deck 
          roomId={roomId}
          cardCount={deckSize}
          className="w-24 h-32"
        />

      </div>

      {/* YOUR HAND (bottom) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-semibold">Your Hand ({myHand.length})</span>
          <div className="flex gap-2">
            {myHand.length > 0 ? (
              myHand.map((card) => (
                <CardFront
                  key={card.id}
                  card={card}
                  onClick={() => playCard(roomId, [card.id])}
                  className="w-16 h-24"
                  isPlayable={true}
                  animate={true}
                />
              ))
            ) : (
              <div className="text-center p-4 text-white/70">
                No cards in hand. Draw a card to start!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* OPPONENT HANDS */}
      {opponentHands.map((opponent, index) => (
        <div 
          key={opponent.playerId} 
          className={`absolute ${
            index === 0 ? 'top-6 left-1/2 -translate-x-1/2' : 
            index === 1 ? 'left-6 top-1/2 -translate-y-1/2' : 
            'right-6 top-1/2 -translate-y-1/2'
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm font-semibold">{opponent.playerId}</span>
            <div className="flex gap-2">
              {Array.from({ length: opponent.cardCount }).map((_, index) => (
                <CardBack key={index} className="w-16 h-24" />
              ))}
            </div>
          </div>
        </div>
      ))}

    </div>
  );
}