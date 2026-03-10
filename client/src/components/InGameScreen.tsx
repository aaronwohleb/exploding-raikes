import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useGame } from "../context/GameContext";
import { useAuth } from "../context/AuthContext";
import { useLobby } from "../context/LobbyContext";
import CardBack from "./CardBack";
import CardFront from "./CardFront";
import DrawDeck from "./DrawDeck"; 
import DiscardDeck from "./DiscardDeck"; 

//Player main screen definition
export default function InGameScreen() {
  const { myHand, lastPlayedCard, playCard } = useGame();
  const { currentLobby } = useLobby();
  const { currentFrontendUser } = useAuth();
  const { roomId: paramRoomId } = useParams();
  
  const roomId = paramRoomId || currentLobby?.code || "ROOM_ID";

  // Filter out the current user to display opponents
  const opponents = currentLobby?.players.filter(
    (p) => p._id !== currentFrontendUser?._id
  ) || [];

  return (
    <div className="relative w-full h-screen bg-emerald-800 text-white overflow-hidden flex flex-col">
      
      
      <div className="h-1/4 w-full flex justify-center items-start pt-8 gap-12">
        {opponents.map((opp) => (
          <div key={opp._id} className="flex flex-col items-center gap-2">
            <div className="relative flex -space-x-8">
              
              {[...Array(5)].map((_, i) => (
                <CardBack key={i} className="w-12 h-16 border border-black/20" />
              ))}
            </div>
            <span className="text-sm font-medium bg-black/40 px-3 py-1 rounded-full">
              {opp.username}
            </span>
          </div>
        ))}
      </div>

      
      <div className="flex-1 w-full flex flex-col items-center justify-center gap-8">
        <div className="flex items-center gap-12 bg-white/5 p-12 rounded-[3rem] border border-white/10 shadow-2xl">
          
          
          <div className="flex flex-col items-center gap-3">
            <DrawDeck roomId={roomId} cardCount={40} className="w-28 h-40" />
            <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Draw</span>
          </div>

          
          <div className="flex flex-col items-center gap-3">
            <DiscardDeck lastCard={lastPlayedCard} className="w-28 h-40" />
            <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Discard</span>
          </div>

        </div>
      </div>

      
      <div className="h-1/3 w-full bg-gradient-to-t from-black/60 to-transparent flex flex-col items-center justify-end pb-10">
        <div className="mb-4 flex items-center gap-4">
          <h2 className="text-xl font-bold italic tracking-tighter text-amber-500">YOUR HAND</h2>
          <span className="bg-amber-500 text-black px-2 py-0.5 rounded text-xs font-black">
            {myHand.length} CARDS
          </span>
        </div>

        <div className="flex -space-x-6 hover:space-x-2 transition-all duration-300">
          {myHand.length > 0 ? (
            myHand.map((card) => (
              <CardFront
                key={card.id}
                card={card}
                onClick={() => playCard(roomId, [card])} 
                className="w-24 h-36 shadow-xl cursor-pointer"
                />
            ))
          ) : (
            <div className="text-white/30 italic">Drawing cards...</div>
          )}
        </div>
      </div>

    </div>
  );
}