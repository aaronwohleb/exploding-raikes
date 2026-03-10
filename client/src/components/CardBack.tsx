import React from 'react';

interface CardBackProps {
  className?: string;
  showCount?: boolean;
  count?: number;
}

export default function CardBack({ className = "", showCount = false, count = 0 }: CardBackProps) {
  return (
    <div className={`relative ${className}`}>
      {/* Main card back - just a brown rectangle */}
      <div className="w-full h-full bg-amber-800 rounded-lg border-2 border-amber-600 shadow-inner" />
      
      {/* Optional count badge (for deck display) */}
      {showCount && (
        <div className="absolute -bottom-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow-lg">
          {count}
        </div>
      )}
    </div>
  );
}