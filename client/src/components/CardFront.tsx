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

  //Card content extraction
  const CardContent = () => (
    <div className="relative w-full h-full">
      {cardImage ? (
        <img 
          src={cardImage} 
          alt={card.type}
          className="w-full h-full object-contain rounded-lg"
        />
      ) : (
        //If a card doesnt have an image
        <div className="w-full h-full bg-gray-700 rounded-lg flex items-center justify-center text-white p-2 text-center text-xs">
          {card.type}
        </div>
      )}
      
      {!isPlayable && (
        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
          <span className="text-white text-xs font-bold">Not playable</span>
        </div>
      )}
    </div>
  );

  // properly animates the cards now picture or no picutre
  if (animate) {
    return (
      <motion.div
        className={`relative w-24 h-32 ${onClick ? "cursor-pointer" : ""} ${className}`}
        onClick={onClick}
        whileHover={isPlayable ? { y: -5, rotate: 2, scale: 1.05 } : {}}
        whileTap={isPlayable ? { scale: 0.95 } : {}}
      >
        <CardContent />
      </motion.div>
    );
  }

  //If there is no animation reutn the contnet
  return (
    <div className={`relative w-24 h-32 ${className}`} onClick={onClick}>
      <CardContent />
    </div>
  );
}