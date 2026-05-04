import React from 'react';
import explodingKauffmanBack from '../assets/explodingKauffmanBack.png';

export default function CardBack({ className = "", showCount = false, count = 0 }) {
  return (
    <div className={`relative ${className}`}>
      <img
        src={explodingKauffmanBack}
        alt="Card back"
        className="w-full h-full object-contain rounded-lg"
      />

      {showCount && (
        <div className="absolute -bottom-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow-lg">
          {count}
        </div>
      )}
    </div>
  );
}
