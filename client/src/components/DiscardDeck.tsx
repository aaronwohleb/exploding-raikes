import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CardFront from './CardFront';
import { Card } from '../types/types';

//props for the discard pile, last card, which is the display for the discard pile, and classname for styling options
interface DiscardPileProps {
  lastCard: Card | null;
  className?: string;
}
//Component definition
export default function DiscardPile({ lastCard, className = "" }: DiscardPileProps) {
  return (
    <div className={`relative border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center ${className}`}>
      <AnimatePresence mode="wait">
        {lastCard ? (
          <motion.div
            key={lastCard.id} 
            className="w-full h-full"
            initial={{ scale: 0.5, opacity: 0, rotate: -20, y: 50 }}
            animate={{ scale: 1, opacity: 1, rotate: 0, y: 0 }}
            transition={{ type: "spring", damping: 15 }}
          >
            <CardFront 
              card={lastCard} 
              animate={false} 
              className="w-full h-full" 
            />
          </motion.div>
        ) : (
          <span className="text-white/20 text-[10px] font-bold uppercase tracking-tighter">
            Discard
          </span>
        )}
      </AnimatePresence>
    </div>
  );
}