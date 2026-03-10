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
  'Attack': attackBase,
  'Bathroom_Drain_Bug': bathroomDrainBugBase,
  'Defuse': defuseBase,
  'Exploding_Cards': explodingCardsmock,
  'Exploding_Kauffman': explodingKauffmanBase,
  'Mega_Bug': megaBugBase,
  'Nope': nopeBase,
  'See_the_Future': seeTheFutureBase,
  'Shuffle': shuffleBase,
  'Skip': skipBase,
  'Syntax_bug': syntaxBugBase,
};

//Card Front proops, all importnat stuff, save for the ? which are all optional extras
interface CardFrontProps {
  card: {
    id: number;
    type: string;
  };
  className?: string;
  onClick?: () => void;
  isPlayable?: boolean;
  animate?: boolean;
}

//Component definition
export default function CardFront({ 
  card, 
  className = "", 
  onClick, 
  isPlayable = true,
  animate = true 
}: CardFrontProps) {
  
  const cardImage = cardImageMap[card.type];
  
  // Just a basic greyscale image if we dont have a matching image yet, right now cards without images cant be played, thats becasue of a small error i made, where if there is no card it returns the card without going through the onclick check, i think i know how to fix it, but its 2 in the morning so im going to fix it tomorrow
  if (!cardImage) {
    console.warn(`No image found for card type: ${card.type}`);
    return (
      <div className={`w-24 h-32 bg-gray-700 rounded-lg flex items-center justify-center text-white p-2 text-center text-xs ${className}`}>
        {card.type}
      </div>
    );
  }

  // The actual card content
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

  //All the cool stuff for animation
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