import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardType, CardRequestType, FrontendUser } from "../types/types";
import CardFront from "./CardFront";

interface InGameModalsProps {
  roomId: string;
  defuseRequest: { maxIndex: number } | null;
  submitDefuseLocation: (roomId: string, insertIndex: number) => void;
  seeTheFutureCards: Card[];
  closeSeeTheFuture: () => void;
  actionRequiresTarget: CardRequestType | null;
  opponents: FrontendUser[];
  eliminatedPlayerIds: string[];
  submitTarget: (roomId: string, targetUserId: string, actionType: CardRequestType, requestedCardType?: CardType) => void;
  fiveCardComboTypes: CardType[] | null;
  submitFiveCardChoice: (roomId: string, cardType: CardType) => void;
  favorRequest: { sourceUserId: string; sourcePlayerName: string } | null;
  myHand: Card[];
  submitFavorCard: (roomId: string, cardId: number, sourceUserId: string) => void;
  showInfoModal: boolean;
  setShowInfoModal: (show: boolean) => void;
  selectedBaseCard: Card | undefined;
  selectedCardIds: number[];
  explodedPlayerId: string | null;
  currentUserId: string | undefined;
  gameOver: { winnerId: string; winnerName: string } | null;
  dismissExplosion: () => void;
}

function getCardDescription(type: string, selectedCount = 1, isAllSameType = true, uniqueCount = 1): string {
  if (isAllSameType) {
    if (selectedCount === 2) return "TWO CARD COMBO: Play 2 of the same card to steal a random card from an opponent.";
    if (selectedCount === 3) return "THREE CARD COMBO: Play 3 of the same card type to choose a card from an opponent's hand if they have one";
  }
  if (selectedCount === 5 && uniqueCount === 5) {
    return "FIVE CARD COMBO: Play 5 different cards to take any card from the discard pile.";
  }
  const descriptions: Record<string, string> = {
    Attack: "End your turn without drawing. Force the next player to take two turns.",
    Defuse: "The only card that can save you from an Exploding Kauffman.",
    Skip: "Immediately end a turn without drawing a card.",
    Favor: "Force another player to give you one card of their choice.",
    See_the_Future: "Privately view the top 3 cards of the deck.",
    Shuffle: "Shuffle the Draw Pile.",
    Nope: "Stop any action except for an Exploding Kauffman or defuse.",
    Legacy_Bug: "A bug that needs to be put in a retirement home. Useless on it's own, but powerful when used in combos.",
    Bathroom_Drain_Bug: "A nasty disgusting bug that crawls out of your drain. Useless on it's own, but powerful when used in combos.",
    Mega_Bug: "The Mega Bug like to live in Megalounge and host mega parties. Useless on it's own, but powerful when used in combos.",
    Syntax_Bug: "a bug whose presnce is revealed by the unfortunate red squiggly line. Useless on it's own, but powerful when used in combos.",
    Heisenbug: "A sneaky bug that changes its behavior when you try to observe it. Useless on it's own, but powerful when used in combos.",
  };
  return descriptions[type] || "A mysterious card with unknown powers.";
}

export default function InGameModals({
  roomId,
  defuseRequest,
  submitDefuseLocation,
  seeTheFutureCards,
  closeSeeTheFuture,
  actionRequiresTarget,
  opponents,
  eliminatedPlayerIds,
  submitTarget,
  fiveCardComboTypes,
  submitFiveCardChoice,
  favorRequest,
  myHand,
  submitFavorCard,
  showInfoModal,
  setShowInfoModal,
  selectedBaseCard,
  selectedCardIds,
  explodedPlayerId,
  currentUserId,
  gameOver,
  dismissExplosion,
}: InGameModalsProps) {
  const navigate = useNavigate();
  const [defuseIndex, setDefuseIndex] = useState(0);

  return (
    <>
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
                Position:{" "}
                {defuseIndex === 0
                  ? "Top Card"
                  : defuseIndex === defuseRequest.maxIndex
                  ? "Bottom Card"
                  : `Depth: ${defuseIndex}`}
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
      {seeTheFutureCards.length > 0 && (
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

      {/* Target Selection Modal */}
      {actionRequiresTarget && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#FCF8EE] text-[#0F0F0F] p-10 rounded-2xl max-w-md w-full shadow-2xl">
            <h2 className="text-5xl font-bold uppercase tracking-[0.02em] mb-2 text-[#0F0F0F] text-center">
              Select Target
            </h2>
            <p className="mb-8 text-gray-500 text-xl text-center">
              You played a {actionRequiresTarget.replace(/_/g, " ")}. Who do you want to target?
            </p>

            {actionRequiresTarget === CardRequestType.Three_Card_Combo && (
              <div className="mb-6">
                <label className="font-normal text-xl uppercase tracking-widest text-gray-900">
                  Card Type to Steal:
                </label>
                <select
                  id="requestedCardType"
                  className="block w-full mt-2 p-4 bg-gray-100 focus:ring-2 focus:ring-[#C81C27] focus:outline-none border-none rounded-xl text-xl font-normal uppercase transition-all"
                >
                  {Object.values(CardType)
                    .filter((type) => type !== CardType.Exploding_Kauffman)
                    .map((type) => (
                      <option key={type} value={type}>
                        {type.replace(/_/g, " ")}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div className="flex flex-col gap-4">
              {opponents
                .filter((opp) => !eliminatedPlayerIds.includes(opp._id))
                .map((opp) => (
                  <motion.button
                    key={opp._id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      const requestedType =
                        actionRequiresTarget === CardRequestType.Three_Card_Combo
                          ? ((document.getElementById("requestedCardType") as HTMLSelectElement).value as CardType)
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
              {fiveCardComboTypes
                .filter((type) => type !== CardType.Exploding_Kauffman)
                .map((type) => (
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

      {/* Favor Request Modal */}
      {favorRequest && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#FCF8EE] text-[#0F0F0F] p-10 rounded-2xl max-w-4xl w-full shadow-2xl">
            <h2 className="text-5xl font-bold uppercase tracking-[0.02em] mb-2 text-[#0F0F0F] text-center">
              Favor Requested!
            </h2>
            <p className="mb-8 text-gray-600 text-2xl text-center">
              <span className="font-bold text-[#B81C27]">{favorRequest.sourcePlayerName}</span> played a Favor on
              you. Select a card from your hand to give them.
            </p>

            <div className="flex gap-4 overflow-x-auto pb-4 px-4 justify-left">
              {myHand.map((card) => (
                <motion.div
                  key={card.id}
                  whileHover={{ scale: 1.05, y: -10 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => submitFavorCard(roomId, card.id, favorRequest.sourceUserId)}
                  className="shrink-0 cursor-pointer"
                >
                  <CardFront card={card} animate={false} className="w-36 h-60 rounded-lg" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Card Info Modal */}
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
              const selectedCards = myHand.filter((c) => selectedCardIds.includes(c.id));
              const count = selectedCards.length;
              const uniqueTypes = new Set(selectedCards.map((c) => c.type)).size;
              const allSame = uniqueTypes === 1;
              const isFiveCardCombo = count === 5 && uniqueTypes === 5;
              const isMultiCombo = allSame && (count === 2 || count === 3);
              const isValidCombo = isFiveCardCombo || isMultiCombo;
              const displayTitle = isValidCombo ? `${count} Card Combo` : selectedBaseCard.type.replace(/_/g, " ");
              const displayDescription = getCardDescription(selectedBaseCard.type, count, allSame, uniqueTypes);

              return (
                <>
                  <h3 className="text-4xl font-bold uppercase text-[#0F0F0F] mb-2">{displayTitle}</h3>
                  <p className="text-gray-600 text-lg leading-relaxed mb-8 font-sans">{displayDescription}</p>
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
        </div>
      )}

      {/* Player Loss Modal */}
      {explodedPlayerId === currentUserId && !gameOver && (
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
                onClick={() => navigate("/")}
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
              {gameOver.winnerId === currentUserId ? "🏆 YOU WIN!" : "GAME OVER"}
            </h2>
            <p className="mb-8 text-gray-600 text-xl text-center">
              {gameOver.winnerId === currentUserId
                ? "You are the last student standing!"
                : `${gameOver.winnerName} wins!`}
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/")}
              className="bg-[#B81C27] hover:bg-[#C81C27] text-[#FCF8EE] px-8 py-4 rounded-[4px] font-normal text-2xl uppercase tracking-[0.02em] shadow-sm w-full transition-colors"
            >
              Return to Lobby
            </motion.button>
          </div>
        </div>
      )}
    </>
  );
}
