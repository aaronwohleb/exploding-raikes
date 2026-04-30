import React from 'react';
import { motion } from 'framer-motion';

// Bug card art
import bathroomDrainBug from '../assets/bathroomDrainBug.png';
import heisenbug from '../assets/heisenbug.png';
import legacyBug from '../assets/legacyBug.png';
import megaBug from '../assets/megaBug.png';
import syntaxBug from '../assets/syntaxBug.png';

// Exploding Kauffman
import explodingKauffmanBase from '../assets/explodingKauffmanBase.png';

// Attack (AT) variants
import austenAT from '../assets/austenAT.png';
import garrettAT from '../assets/garrettAT.png';
import gunnarAT from '../assets/gunnarAT.png';
import gusAT from '../assets/gusAT.png';
import tanishaAT from '../assets/tanishaAT.png';

// Defuse (DE) variants
import aaronDE from '../assets/aaronDE.png';
import chickenDE from '../assets/chickenDE.png';
import drewDE from '../assets/drewDE.png';
import jacDE from '../assets/jacDE.png';
import jacksonDE from '../assets/jacksonDE.png';
import leahDE from '../assets/leahDE.png';
import riyaDE from '../assets/riyaDE.png';
import valDE from '../assets/valDE.png';

// Favor (FA) variants
import calebFA from '../assets/calebFA.png';
import cstoreFA from '../assets/cstoreFA.png';
import isoFA from '../assets/isoFA.png';
import nickFA from '../assets/nickFA.png';

// Nope (NO) variants
import bobNO from '../assets/bobNO.png';
import emmaNO from '../assets/emmaNO.png';
import microsoftNO from '../assets/microsoftNO.png';
import shreyNO from '../assets/shreyNO.png';
import virajNO from '../assets/virajNO.png';

// See the Future (STF) variants
import adamSTF from '../assets/adamSTF.png';
import backSTF from '../assets/backSTF.png';
import jacksonSTF from '../assets/jacksonSTF.png';
import kauffmanSTF from '../assets/kauffmanSTF.png';

// Shuffle (SH) variants
import bubblesSH from '../assets/bubblesSH.png';
import charlieSH from '../assets/charlieSH.png';
import lukeSH from '../assets/lukeSH.png';
import newsSH from '../assets/newsSH.png';

// Skip (SK) variants
import classSK from '../assets/classSK.png';
import gannettSK from '../assets/gannettSK.png';
import gavinSK from '../assets/gavinSK.png';
import wilSK from '../assets/wilSK.png';

// card types: pick variant by card.id
const cardVariantMap: Record<string, string[]> = {
  'Attack':        [austenAT, garrettAT, gunnarAT, gusAT, tanishaAT],
  'Defuse':        [aaronDE, chickenDE, drewDE, jacDE, jacksonDE, leahDE, riyaDE, valDE],
  'Favor':         [calebFA, cstoreFA, isoFA, nickFA],
  'Nope':          [bobNO, emmaNO, microsoftNO, shreyNO, virajNO],
  'See_the_Future':[adamSTF, backSTF, jacksonSTF, kauffmanSTF],
  'Shuffle':       [bubblesSH, charlieSH, lukeSH, newsSH],
  'Skip':          [classSK, gannettSK, gavinSK, wilSK],
};

// Single-image card types
const cardImageMap: Record<string, string> = {
  'Bathroom_Drain_Bug': bathroomDrainBug,
  'Heisenbug':          heisenbug,
  'Legacy_Bug':         legacyBug,
  'Mega_Bug':           megaBug,
  'Syntax_Bug':         syntaxBug,
  'Exploding_Kauffman': explodingKauffmanBase,
};

function getCardImage(type: string, id: number): string | undefined {
  const variants = cardVariantMap[type];
  if (variants) return variants[id % variants.length];
  return cardImageMap[type];
}

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

export default function CardFront({
  card,
  className = "",
  onClick,
  isPlayable = true,
  animate = true
}: CardFrontProps) {

  const cardImage = getCardImage(card.type, card.id);

  const CardContent = () => (
    <div className="relative w-full h-full">
      {cardImage ? (
        <img
          src={cardImage}
          alt={card.type}
          className="w-full h-full object-contain rounded-lg"
        />
      ) : (
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

  return (
    <div className={`relative w-24 h-32 ${className}`} onClick={onClick}>
      <CardContent />
    </div>
  );
}
