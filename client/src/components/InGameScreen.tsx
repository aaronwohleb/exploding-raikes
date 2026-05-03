import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useGame } from "../context/GameContext";
import { useAuth } from "../context/AuthContext";
import { useLobby } from "../context/LobbyContext";
import CardBack from "./CardBack";
import CardFront from "./CardFront";
import DrawDeck from "./DrawDeck";
import DiscardDeck from "./DiscardDeck";
import { CardType, Card } from "../types/types";
import InGameModals from "./InGameModals";


interface FlyAnim {
  key: string;
  card: Card | null;
  fromX: number; fromY: number;
  toX: number; toY: number;
  cardW: number; cardH: number;
}

type RectLike = { left: number; top: number; width: number; height: number };

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
    requestInitialState,
    cardAnimQueue,
    shiftCardAnim,
    playerHandCounts,
  } = useGame();

  const { currentLobby } = useLobby();
  const { currentFrontendUser } = useAuth();
  const { roomId: paramRoomId } = useParams();
  const [showInfoModal, setShowInfoModal] = useState(false);

  const discardWrapRef = useRef<HTMLDivElement>(null);
  const myHandAreaRef = useRef<HTMLDivElement>(null);
  const opponentEls = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const [flyingCards, setFlyingCards] = useState<FlyAnim[]>([]);

  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const pendingPlayPositions = useRef<Map<number, RectLike>>(new Map());

  const spawnFly = useCallback((card: Card | null, from: RectLike, to: RectLike, delay = 0) => {
    const cardW = Math.round(to.width) || 112;
    const cardH = Math.round(to.height) || 160;
    const key = `${Date.now()}-${Math.random()}`;
    const entry: FlyAnim = {
      key, card, cardW, cardH,
      fromX: from.left + from.width / 2 - cardW / 2,
      fromY: from.top + from.height / 2 - cardH / 2,
      toX: to.left,
      toY: to.top,
    };
    const spawn = () => {
      setFlyingCards(prev => [...prev, entry]);
      setTimeout(() => setFlyingCards(prev => prev.filter(f => f.key !== key)), 600);
    };
    delay ? setTimeout(spawn, delay) : spawn();
  }, []);

  const roomId = paramRoomId || currentLobby?.code || "ROOM_ID";

  useEffect(() => {
    if (roomId && currentFrontendUser) {
      requestInitialState(roomId, currentFrontendUser._id);
    }
  }, [roomId, currentFrontendUser]);

  useEffect(() => {
    if (!cardAnimQueue.length) return;
    const trigger = cardAnimQueue[0];
    shiftCardAnim();

    const discardEl = discardWrapRef.current;
    const handEl = myHandAreaRef.current;
    if (!discardEl || !handEl) return;

    const discardRect = discardEl.getBoundingClientRect();
    const handRect = handEl.getBoundingClientRect();

    if (trigger.type === 'player_play') {
      const isMe = trigger.playerId === currentFrontendUser?._id;
      if (isMe) {
        trigger.cards.forEach((card, i) => {
          const saved = pendingPlayPositions.current.get(card.id) ?? handRect;
          spawnFly(card, saved, discardRect, i * 120);
        });
        pendingPlayPositions.current.clear();
      } else {
        const oppEl = opponentEls.current.get(trigger.playerId);
        const fromRect: RectLike = oppEl?.getBoundingClientRect() ?? handRect;
        trigger.cards.forEach((card, i) => spawnFly(card, fromRect, discardRect, i * 120));
      }
    }
  }, [cardAnimQueue, shiftCardAnim, spawnFly, currentFrontendUser]);

  const [selectedCardIds, setSelectedCardIds] = useState<number[]>([]);
  const selectedBaseCard = myHand.find(c => c.id === selectedCardIds[0]);

  const opponents = currentLobby?.players.filter(
    (p) => p._id !== currentFrontendUser?._id
  ) || [];

  const isMyTurn = activeUserId === currentFrontendUser?._id;

  const hasNopeCard = myHand.some(c => c.type === CardType.Nope);

  const getPlayerName = (playerId: string): string => {
    const player = currentLobby?.players.find(p => p._id === playerId);
    return player?.username || "Unknown";
  };

  const handleCardClick = (cardId: number) => {
    setSelectedCardIds((prev) =>
      prev.includes(cardId)
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    );
  };

  const handlePlaySelected = () => {
    if (selectedCardIds.length > 0) {
      selectedCardIds.forEach(id => {
        const el = cardRefs.current.get(id);
        if (el) pendingPlayPositions.current.set(id, el.getBoundingClientRect());
      });
      playCard(roomId, selectedCardIds);
      setSelectedCardIds([]); // Clear selection after playing
    }
  };

  return (
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

              <div ref={(el) => opponentEls.current.set(opp._id, el)} className="relative flex -space-x-8">
                {[...Array(playerHandCounts[opp._id] ?? 0)].map((_, i) => (
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
            <div>
              <DrawDeck roomId={roomId} cardCount={deckCount} className="w-28 h-40" />
            </div>
            <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Draw</span>
          </div>

          
          <div className="flex flex-col items-center gap-3">
            <div ref={discardWrapRef}>
              <DiscardDeck lastCard={lastPlayedCard} className="w-28 h-40" />
            </div>
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
      <div ref={myHandAreaRef} className={`relative z-20 h-1/3 w-full flex flex-col items-center justify-end pb-10 transition-colors duration-500 ${isMyTurn ? 'bg-gradient-to-t from-amber-500/20 to-transparent' : 'bg-gradient-to-t from-black/60 to-transparent'}`}>
        
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
        <div className={`flex justify-center h-64 px-8 w-full transition-all duration-300`}>
          <div className="overflow-x-auto overflow-y-hidden w-full flex">
            <div className="flex flex-nowrap min-w-max px-20 pt-20 pb-10 mx-auto">
          {myHand.length > 0 ? (
            myHand.map((card, index) => {
              const isSelected = selectedCardIds.includes(card.id);
              return (
                <div
                  key={card.id}
                  ref={(el) => { if (el) cardRefs.current.set(card.id, el); else cardRefs.current.delete(card.id); }}
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
                    className={`w-32 h-44 cursor-pointer transition-all ${
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
      <AnimatePresence>
        {explosionNotification && (
          <motion.div
            key="explosion-notification"
            initial={{ opacity: 0, y: -40, x: "-50%", scale: 0.9 }}
            animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
            exit={{ opacity: 0, y: -40, x: "-50%", scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute top-6 left-1/2 z-[70] pointer-events-none"
          >
            <div className="bg-[#B81C27] text-[#FCF8EE] px-8 py-4 rounded-2xl shadow-2xl text-2xl font-bold uppercase tracking-widest animate-bounce">
              {explosionNotification}
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      <InGameModals
        roomId={roomId}
        defuseRequest={defuseRequest}
        submitDefuseLocation={submitDefuseLocation}
        seeTheFutureCards={seeTheFutureCards}
        closeSeeTheFuture={closeSeeTheFuture}
        actionRequiresTarget={actionRequiresTarget}
        opponents={opponents}
        eliminatedPlayerIds={eliminatedPlayerIds}
        submitTarget={submitTarget}
        fiveCardComboTypes={fiveCardComboTypes}
        submitFiveCardChoice={submitFiveCardChoice}
        favorRequest={favorRequest}
        myHand={myHand}
        submitFavorCard={submitFavorCard}
        showInfoModal={showInfoModal}
        setShowInfoModal={setShowInfoModal}
        selectedBaseCard={selectedBaseCard}
        selectedCardIds={selectedCardIds}
        explodedPlayerId={explodedPlayerId}
        currentUserId={currentFrontendUser?._id}
        gameOver={gameOver}
        dismissExplosion={dismissExplosion}
      />

      <AnimatePresence>
        {flyingCards.map(anim => (
          <motion.div
            key={anim.key}
            className="fixed pointer-events-none z-[40]"
            style={{ top: 0, left: 0, width: anim.cardW, height: anim.cardH }}
            initial={{ x: anim.fromX, y: anim.fromY, opacity: 1, rotate: 0 }}
            animate={{ x: anim.toX, y: anim.toY, opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {anim.card
              ? <CardFront card={anim.card} animate={false} className="w-full h-full shadow-2xl" />
              : <CardBack className="w-full h-full shadow-2xl" />
            }
          </motion.div>
        ))}
      </AnimatePresence>

    </div>
  );
}