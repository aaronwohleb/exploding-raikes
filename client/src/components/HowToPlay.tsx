import React, { useState } from "react";
import { useNavigate } from "react-router-dom";


import explodingKauffmanBase from "../assets/explodingKauffmanBase.png";
import defuseBase from "../assets/defuseBase.png";
import attackBase from "../assets/attackBase.png";
import skipBase from "../assets/skipBase.png";
import favorBase from "../assets/favorBase.png";
import shuffleBase from "../assets/shuffleBase.png";
import nopeBase from "../assets/nopeBase.png";
import seeTheFutureBase from "../assets/seeTheFutureBase.png";

import heisenbugBase from "../assets/heisenbugBase.png";
import legacyBugBase from "../assets/legacyBugBase.png";
import megaBugBase from "../assets/megaBugBase.png";
import syntaxBugBase from "../assets/syntaxBugBase.png";
import bathroomDrainBugBase from "../assets/bathroomDrainBugBase.png";

export default function HowToPlay() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const tutorialSteps = [
    {
      title: "Welcome to Exploding Kauffman!",
      content: "A fast-paced card game of luck and strategy. Be the last developer standing!",
      image: null,
      description: "Game Logo / Welcome Screen",
    },
    {
      title: "The Basics",
      content: "You will start the game with 7 random cards, and 1 defuse card. Each turn you may play any number of cards, to help you investigate the order of the draw deck, sabatoge your openents or help yourself. At the end of your turn you must draw a card, if you draw a card without a defuse you die. The only goal is to be the last player standing!",
      image: explodingKauffmanBase,
      imageAlt: "Exploding Kauffman Card - The dreaded card that eliminates players",
    },
    {
      title: "Defuse Cards",
      content: "Got an Exploding Kauffman? Play a Defuse card to stay in the game! Place the explosion back in the deck anywhere you want.",
      image: defuseBase,
      imageAlt: "Defuse Card - Stops Exploding Kauffmans",
    },
    {
      title: "Attack Cards",
      content: "Force the next player to take TWO turns instead of one. Attacking will automatically end your turn and stack any extra turns on top of your attack.",
      image: attackBase,
      imageAlt: "Attack Card - Force the next player to take 2 extra turns",
    },
    {
      title: "Skip Cards",
      content: "Skip one turn without drawing a card. If you were attacked, you still have to play extra turns.",
      image: skipBase,
      imageAlt: "Skip Card - Avoid drawing cards and pass your turn",
    },
    {
      title: "Favor Cards",
      content: "Force another player to give you a card of their choice. Choose wisely!",
      image: favorBase,
      imageAlt: "Favor Card - Demand a card from another player",
    },
    {
      title: "Shuffle Cards",
      content: "Shuffle the draw deck to mix things up. Great for when you know what's coming!",
      image: shuffleBase,
      imageAlt: "Shuffle Card - Randomize the draw deck order",
    },
    {
      title: "Nope Cards",
      content: "Cancel any action card except for Exploding Kauffman or Defuse. Nope their Nope!",
      image: nopeBase,
      imageAlt: "Nope Card - Cancel other players' actions",
    },
    {
      title: "See The Future Cards",
      content: "Privately peek at the top 3 cards of the draw deck. Plan your strategy!",
      image: seeTheFutureBase,
      imageAlt: "See The Future Card - Look ahead at upcoming cards",
    },
    {
      title: "Bug Cards and Combos",
      content: "Bugs are useless on their own, but playing them together can preform combos! Play any two matching cards (ie two Heisenbugs or two Skips) to steal a random card from an opponent. With three of a kind you can demand any one specific card type from an opponent! Choose wisely because if they don't have the specified card type, you get nothing. And lastly if you play five cards of five different types you can take a card from the discard pile!",
      multipleImages: [
        { src: heisenbugBase, alt: "Heisenbug - Disappears when you try to debug it" },
        { src: legacyBugBase, alt: "Legacy Bug - From old code that no one understands" },
        { src: megaBugBase, alt: "Mega Bug - Someone should deep clean megalounge" },
        { src: syntaxBugBase, alt: "Syntax Bug - Small but annoying compilation errors" },
        { src: bathroomDrainBugBase, alt: "Bathroom Drain Bug - Make sure to pour water down the drain" },
      ],
    },
    {
      title: "How to Win",
      content: "Be the last developer standing! Survive all the bugs, explosions, and player attacks to claim victory!",
      image: null,
      description: "",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FCF8EE] p-8">
      <div className="flex justify-between items-start mb-8">
        <button
          onClick={() => navigate("/")}
          className="text-gray-600 hover:text-[#B81C27] text-lg"
        >
          ← Back to Menu
        </button>
        
        <h1 className="text-4xl font-bold text-[#B81C27] uppercase tracking-wide">
          How to Play
        </h1>
        
        <div className="w-24"></div>
      </div>

  
      <div className="flex flex-col items-center justify-center mt-8">
        <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full p-8">
          <div className="text-center mb-6">
            <span className="text-sm font-medium text-[#B81C27] bg-red-50 px-3 py-1 rounded-full">
              Step {step + 1} of {tutorialSteps.length}
            </span>
          </div>

          
          <div className="flex justify-center mb-8 min-h-[200px]">
            {tutorialSteps[step].multipleImages ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 justify-items-center">
                {tutorialSteps[step].multipleImages.map((img, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <img 
                      src={img.src} 
                      alt={img.alt}
                      className="w-28 h-36 object-cover rounded-lg shadow-md hover:scale-105 transition-transform cursor-pointer"
                      title={img.alt}
                    />
                    <span className="text-xs text-gray-600 mt-2 text-center max-w-[112px]">
                      {img.alt.split(' - ')[0]}
                    </span>
                  </div>
                ))}
              </div>
            ) : tutorialSteps[step].image ? (
              <div className="flex flex-col items-center">
                <img 
                  src={tutorialSteps[step].image} 
                  alt={tutorialSteps[step].imageAlt}
                  className="w-40 h-52 object-cover rounded-lg shadow-lg hover:scale-105 transition-transform cursor-pointer"
                />
                {tutorialSteps[step].imageAlt && (
                  <p className="text-xs text-gray-500 mt-3 max-w-xs text-center">
                    {tutorialSteps[step].imageAlt}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <div className="w-40 h-52 bg-gradient-to-br from-[#B81C27] to-[#8B1520] rounded-lg shadow-lg flex items-center justify-center">
                  <span className="text-white text-5xl">
                    {step === 0 ? "🎴" : "🏆"}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-3">
                  {step === 0 ? "Exploding Kauffman" : "Victory!"}
                </p>
              </div>
            )}
          </div>

          <h2 className="text-2xl font-bold text-center text-gray-900 mb-4">
            {tutorialSteps[step].title}
          </h2>

          <div className="text-gray-600 text-lg text-center mb-8 whitespace-pre-line leading-relaxed">
            {tutorialSteps[step].content}
          </div>

          <div className="flex justify-between gap-4">
            <button
              onClick={() => step > 0 && setStep(step - 1)}
              className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                step === 0
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              disabled={step === 0}
            >
              ← Previous
            </button>
            
            <button
              onClick={() => {
                if (step < tutorialSteps.length - 1) {
                  setStep(step + 1);
                } else {
                  navigate("/");
                }
              }}
              className="px-6 py-3 bg-[#B81C27] text-white rounded-xl font-medium hover:bg-[#C81C27] transition-colors"
            >
              {step === tutorialSteps.length - 1 ? "Start Playing!" : "Next →"}
            </button>
          </div>
        </div>

        <div className="mt-8 w-full max-w-md">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#B81C27] transition-all duration-300 ease-out"
              style={{ width: `${((step + 1) / tutorialSteps.length) * 100}%` }}
            />
          </div>
          <p className="text-center text-sm text-gray-500 mt-2">
            {Math.round(((step + 1) / tutorialSteps.length) * 100)}% Complete
          </p>
        </div>
      </div>
    </div>
  );
}