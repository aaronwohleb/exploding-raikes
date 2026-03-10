import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CardBack from './CardBack';
import { useGame } from '../context/GameContext';

interface DeckProps {
  roomId: string;
  className?: string;
  cardCount?: number;
}

export default function Deck({ roomId, className = "", cardCount = 40 }: DeckProps) {
  const { drawCard } = useGame();
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [drawAnimation, setDrawAnimation] = React.useState(false);

  const handleDrawCard = async () => {
    if (isDrawing || cardCount === 0) return;

    setIsDrawing(true);
    setDrawAnimation(true);

    drawCard(roomId);

    setTimeout(() => {
      setDrawAnimation(false);
      setIsDrawing(false);
    }, 500);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Draw animation overlay */}
      <AnimatePresence>
        {drawAnimation && (
          <motion.div
            className="absolute inset-0 pointer-events-none z-10"
            initial={{ scale: 0.5, opacity: 0, y: 0 }}
            animate={{ 
              scale: 1.2, 
              opacity: 1, 
              y: -20,
              rotate: 10,
              transition: { duration: 0.3 }
            }}
            exit={{ 
              scale: 0, 
              opacity: 0, 
              y: -50,
              transition: { duration: 0.2 }
            }}
          >
            {/* Size is controlled by parent div */}
            <CardBack className="w-full h-full" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main deck */}
      <motion.div
        className="relative w-full h-full cursor-pointer"
        onClick={handleDrawCard}
        whileHover={{ scale: cardCount > 0 ? 1.05 : 1 }}
        whileTap={{ scale: cardCount > 0 ? 0.95 : 1 }}
        animate={isDrawing ? { rotate: [0, -5, 5, -5, 0] } : {}}
        transition={{ duration: 0.3 }}
      >
        {/* Stack effect - multiple cards behind */}
        {cardCount > 0 && (
          <>
            <div className="absolute inset-0 bg-amber-900 rounded-lg transform rotate-1 translate-x-1 translate-y-1" />
            <div className="absolute inset-0 bg-amber-800 rounded-lg transform rotate-0.5 translate-x-0.5 translate-y-0.5" />
          </>
        )}
        
        {/* Main deck card - size now controlled by parent */}
        <CardBack 
          showCount={true} 
          count={cardCount}
          className="w-full h-full"
        />

        {/* Empty deck indicator */}
        {cardCount === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute inset-0 bg-gray-800/80 rounded-lg" />
            <span className="relative text-white text-sm font-bold z-10">Empty</span>
          </div>
        )}
      </motion.div>

      {/* Draw pile label */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-white/70 whitespace-nowrap">
        Draw Deck
      </div>
    </div>
  );
}