import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useGame } from "../context/GameContext";
import { useAuth } from "../context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";

interface Player {
  _id: string;
  username: string;
}

export default function InGameScreen() {

  const location = useLocation();
  const { currentFrontendUser } = useAuth();

  const { myHand, lastPlayedCard, drawCard, playCard } = useGame();

  const {
    players: lobbyPlayers = [],
    roomId
  } = (location.state || {}) as { players: Player[]; roomId: string };

  const players = lobbyPlayers.map((player: Player) =>
    player._id === currentFrontendUser?._id ? "You" : player.username
  );

  const prevHandSize = useRef(myHand.length);
  const [drawAnimating, setDrawAnimating] = useState(false);

  useEffect(() => {
    if (myHand.length > prevHandSize.current) {
      setDrawAnimating(true);

      setTimeout(() => {
        setDrawAnimating(false);
      }, 500);
    }

    prevHandSize.current = myHand.length;
  }, [myHand]);

  useEffect(() => {
    console.log("Room ID:", roomId);
    console.log("Current hand:", myHand);
  }, [roomId, myHand]);

  return (
    <div className="relative w-full h-screen bg-green-800 text-white">

      {/* DRAW ANIMATION */}
      <AnimatePresence>
        {drawAnimating && (
          <motion.div
            initial={{ x: "-50%", y: "-50%", scale: 1 }}
            animate={{ x: "-50%", y: "300%", scale: 0.7 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute left-1/2 top-1/2 w-24 h-32 bg-blue-500 rounded flex items-center justify-center"
          >
            Card
          </motion.div>
        )}
      </AnimatePresence>

      {/* PLAYER INDICATORS */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-4">
        {players.map((player: string, index: number) => (
          <div key={index} className="px-4 py-2 bg-green-900 rounded-lg">
            <span className="font-bold">{player}</span>

            {player === "You" && (
              <span className="ml-2 text-xs">
                ({myHand.length} cards)
              </span>
            )}
          </div>
        ))}
      </div>

      {/* CENTER BOARD */}
      <div className="absolute inset-0 flex items-center justify-center gap-20">

        {/* DISCARD */}
        <div className="w-24 h-32 bg-red-600 rounded flex items-center justify-center">
          {lastPlayedCard ? lastPlayedCard.type : "Discard"}
        </div>

        {/* DRAW DECK */}
        <div
          onClick={() => roomId && drawCard(roomId)}
          className="w-24 h-32 bg-blue-600 rounded flex items-center justify-center cursor-pointer"
        >
          Deck
        </div>

      </div>

      {/* PLAYER HAND */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">

        <AnimatePresence>
          {myHand.map((card: any) => (
            <motion.div
              key={card.id}
              layout
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => roomId && playCard(roomId, [card.id])}
              className="w-16 h-24 bg-rose-700 rounded flex items-center justify-center cursor-pointer"
            >
              {card.type}
            </motion.div>
          ))}
        </AnimatePresence>

      </div>

    </div>
  );
}