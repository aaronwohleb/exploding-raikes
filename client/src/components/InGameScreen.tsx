import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from "framer-motion";
import { useGame } from "../context/GameContext";
import { useAuth } from "../context/AuthContext";
import { useLobby } from "../context/LobbyContext";
import CardBack from "./CardBack";
import CardFront from "./CardFront";
import DrawDeck from "./DrawDeck"; 
import DiscardDeck from "./DiscardDeck"; 
import { CardType } from "../types/types";


//Player main screen definition
export default function InGameScreen() {
  const { 
myHand, 
    lastPlayedCard, 
    deckCount, 
    activeUserId,
    defuseRequest,
    submitDefuseLocation,
    playCard,
    playNope,
    actionRequiresTarget, 
    favorRequest,
    nopeWindow,
    fiveCardComboTypes,
    actionMessage,
    playError,
    seeTheFutureCards,
    closeSeeTheFuture,
    submitTarget, 
    submitFavorCard,
    dismissExplosion,
    gameOver,
    explodedPlayerId,
    eliminatedPlayerIds,
    explosionNotification,
    submitFiveCardChoice,
    requestInitialState
  } = useGame();

  const getCardDescription = (type: string, selectedCount: number = 1, isAllSameType: boolean = true, uniqueCount: number = 1) => {

    if (isAllSameType) {
      if (selectedCount === 2) {
        return "TWO CARD COMBO: Play 2 of the same card to steal a random card from an opponent.";
      }else if (selectedCount === 3) {
        return "THREE CARD COMBO: Play 3 of the same card to choose a card from an opponent.";
      }else{

      }
    
  }

  if (selectedCount === 5 && uniqueCount === 5) {
    return "FIVE CARD COMBO: Play 5 different cards to take any card from the discard pile.";
  }
  const descriptions: Record<string, string> = {
    Attack: "End your turn without drawing. Force the next player to take two turns.",
    Defuse: "The only card that can save you from an Exploding Kauffman.",
    Skip: "Immediately end your turn without drawing a card.",
    Favor: "Force another player to give you one card of their choice.",
    See_the_Future: "Privately view the top 3 cards of the deck.",
    Shuffle: "Shuffle the Draw Pile.",
    Nope: "Stop any action except for an Exploding Kauffman",
    Two_Card_Combo: "Play 2 of the same card type to steal a random card from an opponent's hand.",
    Three_Card_Combo: "Play 3 of the same card type to choose a card of from an opponent's hand if they have one",
    Five_Card_Combo: "Play 5 different card types to take any card from the discard pile",
    Legacy_Bug: "A bug that just won't move on. Useless on it's own, but powerful when used in combos.",
    Bathroom_Drain_Bug: "A nasty disgusting bug that crawls out of your drain. Useless on it's own, but powerful when used in combos.",
    Mega_Bug: "The Mega Bug like to live underground and host parties. Useless on it's own, but powerful when used in combos.",
    Syntax_Bug: "a dreded bug whose presnce is revealed by the dreaded red squiggly line. Useless on it's own, but powerful when used in combos.",
    Heisenbug: "A sneaky bug that changes its behavior when you try to observe it. Useless on it's own, but powerful when used in combos.",
  };
  return descriptions[type] || "A mysterious card with unknown powers.";
};

  
  const { currentLobby } = useLobby();
  const { currentFrontendUser } = useAuth();
  const { roomId: paramRoomId } = useParams();
  const [defuseIndex, setDefuseIndex] = useState<number>(0);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const navigate = useNavigate();
  
  const roomId = paramRoomId || currentLobby?.code || "ROOM_ID";

  useEffect(() => {
    if (roomId && currentFrontendUser) {
      requestInitialState(roomId, currentFrontendUser._id);
    }
  }, [roomId, currentFrontendUser]);

  // State to track which cards the user has selected to play (for combos)
  const [selectedCardIds, setSelectedCardIds] = useState<number[]>([]);
  const selectedBaseCard = myHand.find(c => c.id === selectedCardIds[0]);
  
  // Filter out the current user to display opponents
  const opponents = currentLobby?.players.filter(
    (p) => p._id !== currentFrontendUser?._id
  ) || [];

  const isMyTurn = activeUserId === currentFrontendUser?._id;

  // Check if this player has a Nope card in hand
  const hasNopeCard = myHand.some(c => c.type === CardType.Nope);

  /**
   * Look up a player's display name from the lobby player list.
   */
  const getPlayerName = (playerId: string): string => {
    const player = currentLobby?.players.find(p => p._id === playerId);
    return player?.username || "Unknown";
  };

  // Toggle card selection
  const handleCardClick = (cardId: number) => {
    setSelectedCardIds((prev) =>
      prev.includes(cardId)
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    );
  };

  // Play the selected cards
  const handlePlaySelected = () => {
    if (selectedCardIds.length > 0) {
      playCard(roomId, selectedCardIds);
      setSelectedCardIds([]); // Clear selection after playing
    }
  };

  return (
    // <div className="relative w-full h-screen bg-emerald-800 text-white overflow-hidden flex flex-col">
    <div 
      className="relative w-full h-screen overflow-hidden flex flex-col selection:bg-red-100"
      style={{
        backgroundColor: "#065F46",
        color: "#0F0F0F",
        fontFamily: '"bebas-neue-pro-semiexpanded", sans-serif',
      }}
    >

    {/* --- INFO BUTTON --- */}
      {selectedCardIds.length >= 1 && (
        <motion.button 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setShowInfoModal(true)}
          className="absolute top-6 right-6 z-50 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-xl"
        >
          <span className="text-2xl font-bold italic">i</span>
        </motion.button>
      )}
      {/* --- action messages + play errors --- */} 
      {/* Will consolidate with emmas later */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-3 pointer-events-none">
        <AnimatePresence>
          {actionMessage && (
            <motion.div
              key="action-msg"
              initial={{ y: -40, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -40, opacity: 0, scale: 0.9 }}
              className="bg-[#FCF8EE] text-[#0F0F0F] px-10 py-4 rounded-2xl shadow-2xl border-2 border-[#B81C27]"
            >
              <p className="text-2xl font-bold uppercase tracking-[0.02em] text-center">
                {actionMessage}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
 
        <AnimatePresence>
          {playError && (
            <motion.div
              key="play-error"
              initial={{ y: -40, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -40, opacity: 0, scale: 0.9 }}
              className="bg-[#B81C27] text-[#FCF8EE] px-8 py-3 rounded-2xl shadow-2xl"
            >
              <p className="text-xl font-bold uppercase tracking-[0.02em] text-center">
                {playError}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
 
      {/* --- NOPE WINDOW BANNER --- */}
      <AnimatePresence>
        {nopeWindow && (
          <motion.div
            key="nope-banner"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: "spring", damping: 20 }}
            className="absolute top-0 left-0 right-0 z-50 bg-[#0F0F0F]/90 backdrop-blur-md border-b-4 border-[#B81C27] px-8 py-5"
          >
            <div className="max-w-2xl mx-auto flex items-center justify-between gap-6">
              {/* Play description */}
              <div className="flex-1">
                <p className="text-[#FCF8EE] text-2xl font-bold uppercase tracking-[0.02em]">
                  {getPlayerName(nopeWindow.playerId)} played{" "}
                  <span className="text-[#B81C27]">
                    {nopeWindow.cards.map(c => c.type.replace(/_/g, " ")).join(" + ")}
                  </span>
                  {nopeWindow.targetPlayerName && (
                    <span className="text-amber-400"> → {nopeWindow.targetPlayerName}</span>
                  )}
                </p>
                <p className="text-white/40 text-sm uppercase tracking-widest mt-1">
                  Nope window open...
                </p>
              </div>
 
            </div>
 
            {/* Countdown bar */}
            <motion.div
              className="absolute bottom-0 left-0 h-1 bg-[#B81C27]"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 5, ease: "linear" }}
              key={`nope-timer-${nopeWindow.startedAt}`}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* --- OPPONENTS AREA --- */}
      <div className="h-1/4 w-full flex justify-center items-start pt-8 gap-12">
        {opponents.map((opp) => {
          // Check if it is this specific opponent's turn
          const isOpponentTurn = activeUserId === opp._id;

          return (
            <div 
              key={opp._id} 
              className={`flex flex-col items-center gap-2 transition-all duration-300 ${
                eliminatedPlayerIds.includes(opp._id) 
                    ? 'opacity-30' 
                    : isOpponentTurn ? 'scale-110 drop-shadow-2xl opacity-100' : 'opacity-50'
            }`}
            >
              {/* Floating Thinking Badge */}
              <div className="h-4">
                {isOpponentTurn && <span className="text-amber-400 font-bold text-sm animate-pulse tracking-widest">THINKING...</span>}
              </div>

              <div className="relative flex -space-x-8">
                {[...Array(5)].map((_, i) => (
                  <CardBack key={i} className="w-12 h-16" />
                ))}
                {eliminatedPlayerIds.includes(opp._id) && (
                  <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-red-500 text-6xl font-black">✕</span>
                  </div>
                )}
              </div>
              <span className={`text-lg font-medium px-3 py-1 rounded-full ${
                eliminatedPlayerIds.includes(opp._id)
                    ? 'bg-red-900/60 text-red-300 line-through'
                    : isOpponentTurn ? 'bg-amber-500 text-black' : 'bg-black/40 text-white'
              }`}
            >
                {opp.username}
              </span>
            </div>
        );
      })}
      </div>

      {/* --- MAIN BOARD --- */}
      <div className="flex-1 w-full flex flex-col items-center justify-center gap-8">
        <div className="flex items-center gap-12 bg-white/5 p-12 rounded-[3rem] border border-white/10 shadow-2xl">
          
          
          <div className="flex flex-col items-center gap-3">
            <DrawDeck roomId={roomId} cardCount={deckCount} className="w-28 h-40" />
            <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Draw</span>
          </div>

          
          <div className="flex flex-col items-center gap-3">
            <DiscardDeck lastCard={lastPlayedCard} className="w-28 h-40" />
            <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Discard</span>
          </div>

          {/* Nope button — appears to the right of the discard pile during the nope window */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-28 h-40 flex items-center justify-center">
              <AnimatePresence>
                {nopeWindow && hasNopeCard && (
                  <motion.button
                    key="nope-btn"
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.7, opacity: 0 }}
                    whileHover={{ scale: 1.06, y: -3 }}
                    whileTap={{ scale: 0.95, y: 4 }}
                    onClick={() => playNope(roomId)}
                    className="w-24 h-24 rounded-full text-[#FCF8EE] text-xl font-bold uppercase tracking-[0.06em] select-none"
                    style={{
                      background: "radial-gradient(circle at 40% 35%, #e8333e, #9b1520 60%, #6b0d16)",
                      boxShadow: "0 6px 0 #4a0810, 0 10px 28px rgba(184,28,39,0.55), inset 0 1px 0 rgba(255,255,255,0.18)",
                    }}
                  >
                    NOPE!
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
            <span className="text-xs font-bold text-white/0 uppercase tracking-widest">Nope</span>
          </div>

        </div>
      </div>

      {/* --- PLAYER HAND AREA --- */}
      <div className={`relative z-20 h-1/3 w-full flex flex-col items-center justify-end pb-10 transition-colors duration-500 ${isMyTurn ? 'bg-gradient-to-t from-amber-500/20 to-transparent' : 'bg-gradient-to-t from-black/60 to-transparent'}`}>
        
        <div className="mb-4 flex items-center gap-4">
          <h2 className={`text-xl font-bold italic tracking-tighter ${isMyTurn ? 'text-amber-400 animate-pulse' : 'text-gray-400'}`}>
            {isMyTurn ? '👉 YOUR TURN 👈' : 'YOUR HAND'}
          </h2>
          <span className={`${isMyTurn ? 'bg-amber-400 text-black' : 'bg-gray-600 text-gray-300'} px-2 py-0.5 rounded text-xs font-black transition-colors`}>
            {myHand.length} CARDS
          </span>
          
          {selectedCardIds.length > 0 && isMyTurn && (
            <button 
              onClick={handlePlaySelected}
              className="ml-4 bg-[#B81C27] hover:bg-red-600 text-white px-6 py-2 rounded-full font-bold uppercase tracking-widest shadow-lg transition-transform hover:scale-105"
            >
              Play Selected ({selectedCardIds.length})
            </button>
          )}
        </div>

        {/* Hand Render (card fanning effect)*/}
        <div className={`flex justify-center h-64 px-8 w-full transition-all duration-300}`}>
          <div className="overflow-x-auto overflow-y-visible no-scrollbar w-full flex justify-center">
            <div className="flex flex-nowrap min-w-max px-20 pt-20 pb-10">
          {myHand.length > 0 ? (
            myHand.map((card, index) => {
              const isSelected = selectedCardIds.includes(card.id);
              return (
                <div 
                  key={card.id} 
                  className={`relative cursor-pointer transition-all duration-300 ease-out transform-gpu
                    ${index === 0 ? 'ml-0' : '-ml-4'} 
                    ${isSelected 
                      ? '-translate-y-12 mx-4 scale-110 z-30' 
                      : 'hover:-translate-y-12 hover:mx-4 hover:scale-110 hover:rotate-2 hover:z-40 z-10'
                    }
                  `}
                >
                  <CardFront
                    card={card}
                    onClick={() => handleCardClick(card.id)} 
                    // Add a ring and translate upward if the card is currently selected
                    className={`w-24 h-36 cursor-pointer transition-all ${
                      isSelected ? '-translate-y-6 ring-4 ring-amber-500 rounded-lg' : ''
                    }`}
                  />
                </div>
              );
            })
          ) : (
            <div className="text-white/30 italic">Drawing cards...</div>
          )}
          
            </div> 
          </div>
        </div>
      </div>

      {/* Explosion Notification */}
      {explosionNotification && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-[#B81C27] text-[#FCF8EE] px-8 py-4 rounded-2xl shadow-2xl text-2xl font-bold uppercase tracking-widest animate-bounce">
              {explosionNotification}
          </div>
      )}


      {/* INTERACTIVE MODALS */}

      {/* Defuse Slider Modal */}
      {defuseRequest && (
        <div className="absolute inset-0 bg-red-900/90 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#FCF8EE] text-[#0F0F0F] p-8 rounded-2xl max-w-md w-full shadow-2xl flex flex-col items-center">
             <h2 className="text-5xl font-bold uppercase tracking-[0.02em] mb-2 text-[#B81C27] animate-pulse">
                 DEFUSED!
             </h2>
             <p className="mb-6 text-gray-600 text-xl text-center">
                 You stopped the explosion! Now, secretly place the Exploding Kauffman back into the deck.
             </p>
             
             <div className="w-full mb-8">
                 <label className="font-normal text-lg uppercase tracking-widest text-gray-500 flex justify-between">
                     <span>Top</span>
                     <span>Bottom</span>
                 </label>
                 
                 <input 
                     type="range" 
                     min="0" 
                     max={defuseRequest.maxIndex} 
                     defaultValue="0"
                     onChange={(e) => setDefuseIndex(Number(e.target.value))}
                     className="w-full mt-2 accent-[#B81C27] h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                 />
                 
                 <p className="text-center mt-4 font-bold text-2xl text-[#B81C27] uppercase">
                     Position: {defuseIndex === 0 ? "Top Card" : defuseIndex === defuseRequest.maxIndex ? "Bottom Card" : `Depth: ${defuseIndex}`}
                 </p>
             </div>

             <motion.button
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.98 }}
                 onClick={() => submitDefuseLocation(roomId, defuseIndex)}
                 className="bg-[#B81C27] hover:bg-[#C81C27] text-[#FCF8EE] px-8 py-4 rounded-[4px] font-normal text-2xl uppercase tracking-[0.02em] shadow-sm w-full transition-colors"
             >
                 Hide Kauffman
             </motion.button>
          </div>
        </div>
      )}

      


      {/* See the Future Modal */}
      {seeTheFutureCards && seeTheFutureCards.length > 0 && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#FCF8EE] text-[#0F0F0F] p-10 rounded-2xl max-w-3xl w-full shadow-2xl flex flex-col items-center">
            <h2 className="text-5xl font-bold uppercase tracking-[0.02em] mb-2 text-[#0F0F0F]">
              The Future
            </h2>
            <p className="mb-8 text-gray-500 text-xl uppercase tracking-widest">
              Here are the top {seeTheFutureCards.length} cards of the deck.
            </p>
            
            <div className="flex gap-8 mb-8">
              {seeTheFutureCards.map((card, idx) => (
                <div key={`${card.id}-${idx}`} className="flex flex-col items-center gap-3">
                   <span className="font-bold text-gray-400 uppercase tracking-widest text-lg">
                     {idx === 0 ? "Top Card" : `Card ${idx + 1}`}
                   </span>
                   <CardFront card={card} animate={false} className="w-36 h-52 rounded-lg" />
                </div>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={closeSeeTheFuture}
              className="bg-[#B81C27] hover:bg-[#C81C27] text-[#FCF8EE] px-16 py-4 rounded-[4px] text-2xl font-normal uppercase tracking-[0.02em] transition-colors"
            >
              Done
            </motion.button>
          </div>
        </div>
      )}

      {/* Target Selection Modal (For Favors and Combos) */}
      {actionRequiresTarget && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#FCF8EE] text-[#0F0F0F] p-10 rounded-2xl max-w-md w-full shadow-2xl">
            <h2 className="text-5xl font-bold uppercase tracking-[0.02em] mb-2 text-[#0F0F0F] text-center">
              Select Target
            </h2>
            <p className="mb-8 text-gray-500 text-xl text-center">
              You played a {actionRequiresTarget.replace(/_/g, " ")}. Who do you want to target?
            </p>

            {actionRequiresTarget === 'Three_Card_Combo' && (
              <div className="mb-6">
                <label className="font-normal text-xl uppercase tracking-widest text-gray-900">
                  Card Type to Steal:
                </label>
                <select 
                  id="requestedCardType" 
                  className="block w-full mt-2 p-4 bg-gray-100 focus:ring-2 focus:ring-[#C81C27] focus:outline-none border-none rounded-xl text-xl font-normal uppercase transition-all"
                >
                  {Object.values(CardType).filter(type => type !== CardType.Exploding_Kauffman).map(type => (
                    <option key={type} value={type}>{type.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-col gap-4">
              {opponents.map(opp => (
                <motion.button
                  key={opp._id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    const requestedType = actionRequiresTarget === 'Three_Card_Combo'
                      ? (document.getElementById('requestedCardType') as HTMLSelectElement).value as CardType
                      : undefined;
                    
                    submitTarget(roomId, opp._id, actionRequiresTarget, requestedType);
                  }}
                  className="w-full bg-white border-2 border-gray-200 hover:border-[#B81C27] text-[#0F0F0F] py-4 px-4 rounded-[4px] text-2xl font-normal uppercase tracking-[0.02em] transition-colors"
                >
                  {opp.username}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Five Card Combo Type Picker Modal */}
      {fiveCardComboTypes && fiveCardComboTypes.length > 0 && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#FCF8EE] text-[#0F0F0F] p-10 rounded-2xl max-w-md w-full shadow-2xl">
            <h2 className="text-5xl font-bold uppercase tracking-[0.02em] mb-2 text-[#0F0F0F] text-center">
              Five Card Combo
            </h2>
            <p className="mb-8 text-gray-500 text-xl text-center">
              Pick a card type to take from the discard pile.
            </p>
 
            <div className="flex flex-col gap-3 max-h-80 overflow-y-auto">
              {fiveCardComboTypes.filter(type => type !== CardType.Exploding_Kauffman).map(type => (
                <motion.button
                  key={type}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => submitFiveCardChoice(roomId, type)}
                  className="w-full bg-white border-2 border-gray-200 hover:border-[#B81C27] text-[#0F0F0F] py-4 px-4 rounded-[4px] text-2xl font-normal uppercase tracking-[0.02em] transition-colors"
                >
                  {type.replace(/_/g, " ")}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Favor Request Modal (For the victim) */}
      {favorRequest && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#FCF8EE] text-[#0F0F0F] p-10 rounded-2xl max-w-4xl w-full shadow-2xl">
            <h2 className="text-5xl font-bold uppercase tracking-[0.02em] mb-2 text-[#0F0F0F] text-center">
              Favor Requested!
            </h2>
            <p className="mb-8 text-gray-600 text-2xl text-center">
              <span className="font-bold text-[#B81C27]">{favorRequest.sourcePlayerName}</span> played a Favor on you. Select a card from your hand to give them.
            </p>
            
            <div className="flex gap-4 overflow-x-auto pb-4 px-4 justify-left">
              {myHand.map(card => (
                <motion.div 
                  key={card.id} 
                  whileHover={{ scale: 1.05, y: -10 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => submitFavorCard(roomId, card.id, favorRequest.sourceUserId)}
                  className="shrink-0 cursor-pointer"
                >
                  <CardFront card={card} animate={false} className="w-36 h-60  rounded-lg" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- CARD INFO POPUP --- */}
      {showInfoModal && selectedBaseCard && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[60]">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-[#FCF8EE] p-8 rounded-3xl max-w-sm w-full shadow-2xl flex flex-col items-center text-center border-4 border-[#B81C27]"
          >
            <div className="mb-6">
              <CardFront card={selectedBaseCard} animate={false} className="w-40 h-56 mx-auto shadow-2xl" />
            </div>

            {(() => {
              const selectedCards = myHand.filter(c => selectedCardIds.includes(c.id));
              const count = selectedCards.length;
              const uniqueTypes = new Set(selectedCards.map(c => c.type)).size;
              const allSame = uniqueTypes === 1;

              const isFiveCardCombo = count === 5 && uniqueTypes === 5;
              const isMultiCombo = allSame && (count === 2 || count === 3);
              const isValidCombo = isFiveCardCombo || isMultiCombo;

              const displayTitle = isValidCombo 
                ? `${count} Card Combo` 
                : selectedBaseCard.type.replace(/_/g, " ");

              const displayDescription = getCardDescription(
                selectedBaseCard.type, 
                count, 
                allSame, 
                uniqueTypes
              );
  

              
              return (
              <>
                <h3 className="text-4xl font-bold uppercase text-[#0F0F0F] mb-2">
                  {displayTitle}
                </h3>
                <p className="text-gray-600 text-lg leading-relaxed mb-8 font-sans">
                  {displayDescription}
                </p>
              </>
              );
      })()}

            <button
              onClick={() => setShowInfoModal(false)}
              className="w-full bg-[#B81C27] text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-red-700 transition-colors shadow-lg"
            >
              Back to Game
            </button>
          </motion.div>
      {/* Player Loss Modal */}
      {explodedPlayerId === currentFrontendUser?._id && !gameOver && (
        <div className="absolute inset-0 bg-red-900/90 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#FCF8EE] text-[#0F0F0F] p-8 rounded-2xl max-w-md w-full shadow-2xl flex flex-col items-center">
            <h2 className="text-5xl font-bold uppercase tracking-[0.02em] mb-2 text-[#B81C27] animate-pulse">
              YOU EXPLODED 💥
            </h2>
            <p className="mb-8 text-gray-600 text-xl text-center">
              You drew an Exploding Kauffman and have no Defuse. You're out!
            </p>
            <div className="flex flex-col gap-4 w-full">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/')}
                className="bg-[#B81C27] hover:bg-[#C81C27] text-[#FCF8EE] px-8 py-4 rounded-[4px] font-normal text-2xl uppercase tracking-[0.02em] shadow-sm w-full transition-colors"
              >
                Return to Lobby
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => dismissExplosion()}
                className="bg-white border-2 border-gray-200 hover:border-[#B81C27] text-[#0F0F0F] px-8 py-4 rounded-[4px] font-normal text-2xl uppercase tracking-[0.02em] w-full transition-colors"
              >
                Spectate
              </motion.button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {gameOver && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#FCF8EE] text-[#0F0F0F] p-8 rounded-2xl max-w-md w-full shadow-2xl flex flex-col items-center">
            <h2 className="text-5xl font-bold uppercase tracking-[0.02em] mb-2 text-[#B81C27]">
              {gameOver.winnerId === currentFrontendUser?._id ? '🏆 YOU WIN!' : 'GAME OVER'}
            </h2>
            <p className="mb-8 text-gray-600 text-xl text-center">
              {gameOver.winnerId === currentFrontendUser?._id 
                ? 'You are the last student standing!' 
                : `${gameOver.winnerName} wins!`}
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/')}
              className="bg-[#B81C27] hover:bg-[#C81C27] text-[#FCF8EE] px-8 py-4 rounded-[4px] font-normal text-2xl uppercase tracking-[0.02em] shadow-sm w-full transition-colors"
            >
              Return to Lobby
            </motion.button>
          </div>
        </div>
      )}

    </div>
  );
}