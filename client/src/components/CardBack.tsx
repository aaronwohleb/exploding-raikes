import React from 'react';


//Component definition
export default function CardBack({ className = "", showCount = false, count = 0 }) {
  return (
    //Card Back Design
    <div className={`relative ${className}`}>
      
      <div className="w-full h-full bg-amber-800 rounded-lg border-2 border-amber-600 shadow-inner" />
      
      {showCount && (
        //I saw this cool little thing where you make a little badeg on deck, that shows how many cards are left in ther, it could be fun to try an make it look like a little count down timer later on*
        <div className="absolute -bottom-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow-lg">
          {count}
        </div>
      )}
    </div>
  );
}