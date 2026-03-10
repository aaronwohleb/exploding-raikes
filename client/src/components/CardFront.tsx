import React from 'react';
import { motion } from 'framer-motion';

// Import all card images
import attackBase from '../assets/attackBase.png';
import bathroomDrainBugBase from '../assets/bathroomDrainBugBase.png';
import defuseBase from '../assets/defuseBase.png';
import explodingCardsmock from '../assets/explodingCardsmock.png';
import explodingKauffmanBase from '../assets/explodingKauffmanBase.png';
import megaBugBase from '../assets/megaBugBase.png';
import nopeBase from '../assets/nopeBase.png';
import seeTheFutureBase from '../assets/seeTheFutureBase.png';
import shuffleBase from '../assets/shuffleBase.png';
import skipBase from '../assets/skipBase.png';
import syntaxBugBase from '../assets/syntaxBugBase.png';

// Map card types to their images
const cardImageMap: Record<string, string> = {
  'attack': attackBase,
  'bathroom_drain_bug': bathroomDrainBugBase,
  'defuse': defuseBase,
  'exploding_cards': explodingCardsmock,
  'exploding_kauffman': explodingKauffmanBase,
  'mega_bug': megaBugBase,
  'nope': nopeBase,
  'see_the_future': seeTheFutureBase,
  'shuffle': shuffleBase,
  'skip': skipBase,
  'syntax_bug': syntaxBugBase,
};

interface CardFrontProps {
  card: {
    id: number;
    type: string;
    // any other card properties
  };
  className?: string;
  onClick?: () => void;
  isPlayable?: boolean;
  animate?: boolean;
}

export default function CardFront({ 
  card, 
  className = "", 
  onClick, 
  isPlayable = true,
  animate = true 
}: CardFrontProps) {
  
  const cardImage = cardImageMap[card.type];
  
  // If no image found for this card type
  if (!cardImage) {
    console.warn(`No image found for card type: ${card.type}`);
    return (
      <div className={`w-24 h-32 bg-gray-700 rounded-lg flex items-center justify-center text-white p-2 text-center text-xs ${className}`}>
        {card.type}
      </div>
    );
  }

  const CardContent = () => (
    <div className="relative w-full h-full">
      <img 
        src={cardImage} 
        alt={card.type}
        className="w-full h-full object-contain rounded-lg"
      />
      {!isPlayable && (
        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
          <span className="text-white text-xs font-bold">Not playable</span>
        </div>
      )}
    </div>
  );

  if (animate && onClick) {
    return (
      <motion.div
        className={`relative w-24 h-32 cursor-pointer hover:scale-105 transition-transform ${className}`}
        onClick={onClick}
        whileHover={{ y: -5, rotate: 2 }}
        whileTap={{ scale: 0.95 }}
      >
        <CardContent />
      </motion.div>
    );
  }

  if (animate) {
    return (
      <motion.div
        className={`relative w-24 h-32 ${className}`}
        whileHover={{ y: -5 }}
      >
        <CardContent />
      </motion.div>
    );
  }

  return (
    <div className={`relative w-24 h-32 ${className}`}>
      <CardContent />
    </div>
  );
}