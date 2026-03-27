import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CardBack from './CardBack';
import { useGame } from '../context/GameContext';

//props for the draw deck, room id tells ya what deck to pluck from, card count is for the timer on the deck, calssname is for styling like in discardDec
interface DrawDeckProps {
  roomId: string;
  cardCount: number;
  className?: string;
}

//Component definition
export default function DrawDeck({ roomId, cardCount, className = "" }: DrawDeckProps) {
  const { drawCard } = useGame();
  const [drawAnimation, setDrawAnimation] = React.useState(false);

  const handleDraw = () => {
    if (cardCount === 0 || drawAnimation) return;
    
    setDrawAnimation(true);
    drawCard(roomId);

    // Reset animation state after it finishes
    setTimeout(() => setDrawAnimation(false), 500);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Draw Animation Overlay */}
      <AnimatePresence>
        {drawAnimation && (
          <motion.div
            className="absolute inset-0 z-20 pointer-events-none"
            initial={{ y: 0, opacity: 1, scale: 1 }}
            animate={{ y: -100, opacity: 0, scale: 1.1 }}
            exit={{ opacity: 0 }}
          >
            <CardBack className="w-full h-full" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="relative w-full h-full cursor-pointer"
        onClick={handleDraw}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Visual stack effect */}
        {cardCount > 1 && (
          <div className="absolute inset-0 bg-amber-900 rounded-lg translate-x-1 translate-y-1 -z-10" />
        )}
        
        <CardBack showCount={true} count={cardCount} className="w-full h-full" />
        
        {cardCount === 0 && (
          <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">EMPTY</span>
          </div>
        )}
      </motion.div>
    </div>
  );
}