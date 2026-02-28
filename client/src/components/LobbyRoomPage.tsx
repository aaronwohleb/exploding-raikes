import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLobby } from "../context/LobbyContext";

export default function LobbyRoomPage() {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>(); // Gets the code from /lobby/:code
  const { currentFrontendUser } = useAuth();
  const { currentLobby, clearLobby, toggleReadyStatus } = useLobby();

  const [copied, setCopied] = useState(false);
  const [isTogglingReady, setIsTogglingReady] = useState(false);

  // If the user refreshes the page, context is lost. Redirect to join.
  if (!currentLobby || !currentFrontendUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FCF8EE]">
        <div className="text-center">
          <h2 className="text-3xl font-bold uppercase mb-4">Lobby Disconnected</h2>
          <button 
            onClick={() => navigate('/join')}
            className="px-6 py-2 bg-[#B81C27] text-white rounded font-bold uppercase"
          >
            Return to Join Page
          </button>
        </div>
      </div>
    );
  }

  // Derived state for the UI
  const isHost = currentLobby.hostId === currentFrontendUser._id;
  const isCurrentlyReady = currentLobby.readyStatus[currentFrontendUser._id] || false;
  const allPlayersReady = currentLobby.players.length > 1 && 
    currentLobby.players.every((p: any) => currentLobby.readyStatus[p._id]);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentLobby.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleReady = async () => {
  setIsTogglingReady(true);
  try {
    await toggleReadyStatus(currentFrontendUser._id, !isCurrentlyReady);
  } finally {
    setIsTogglingReady(false);
  }
};

  const handleLeaveLobby = () => {
    // Note: You should ideally call a leaveLobby API endpoint here too!
    clearLobby();
    navigate("/");
  };

  const handleStartGame = () => {
    // We will build the Start Game API endpoint next!
    console.log("Starting game...");
  };

  return (
    <div
      className="relative w-full h-screen overflow-hidden selection:bg-red-100 flex flex-col"
      style={{
        backgroundColor: "#FCF8EE",
        color: "#0F0F0F",
        fontFamily: '"bebas-neue-pro-semiexpanded", sans-serif',
      }}
    >
      {/* --- HEADER --- */}
      <header className="w-full p-8 flex justify-between items-start z-10 shrink-0">
        <motion.button
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLeaveLobby}
          className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors w-1/3"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-bold tracking-widest uppercase">Leave Lobby</span>
        </motion.button>

        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex flex-col items-center w-1/3"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-center uppercase tracking-[0.02em]">
            Waiting Room
          </h1>
          <button 
            onClick={handleCopy}
            className="mt-2 flex items-center gap-2 px-4 py-1 bg-[#EDE8DA] hover:bg-[#E3DEC9] transition-colors rounded"
          >
            <span className="text-xl font-mono tracking-[0.2em] font-bold">{currentLobby.code}</span>
            <span className="text-xs uppercase font-bold text-gray-500">{copied ? "Copied!" : "Copy"}</span>
          </button>
        </motion.div>

        <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="w-1/3 flex justify-end">
          <div className="flex items-center gap-3 p-2">
            <div className="text-right">
              <p className="text-xl font-medium text-gray-900">{currentFrontendUser.username}</p>
            </div>
            <div className="w-12 h-12 bg-[#B81C27] rounded-xl flex items-center justify-center text-white shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </motion.div>
      </header>

      {/* --- MAIN CONTENT (PLAYER LIST) --- */}
      <main className="flex-1 overflow-y-auto px-8 flex flex-col items-center justify-start pt-8 pb-32">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-2xl flex flex-col gap-3"
        >
          <div className="flex justify-between items-end mb-2 px-2 border-b-2 border-gray-200 pb-2">
            <h3 className="text-2xl font-bold uppercase text-gray-400 tracking-widest">Players ({currentLobby.players.length}/{currentLobby.maxPlayers})</h3>
            <span className="text-sm font-bold uppercase text-gray-400 tracking-widest">Status</span>
          </div>

          <AnimatePresence>
            {currentLobby.players.map((player: any) => {
              // DIRECT RECORD LOOKUP! This is why we used the Record<string, boolean> dictionary!
              const isPlayerReady = currentLobby.readyStatus[player._id]; 
              const isPlayerHost = currentLobby.hostId === player._id;

              return (
                <motion.div
                  key={player._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg ${isPlayerHost ? 'bg-yellow-500' : 'bg-gray-300'}`}>
                      {player.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-2xl font-medium text-gray-900 leading-none">{player.username}</p>
                      {isPlayerHost && <p className="text-xs font-bold uppercase text-yellow-500 tracking-widest mt-1">Host</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isPlayerReady ? (
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-bold uppercase tracking-widest rounded">Ready</span>
                    ) : (
                      <span className="px-3 py-1 bg-gray-100 text-gray-500 text-sm font-bold uppercase tracking-widest rounded">Waiting</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </main>

      {/* --- FOOTER CONTROLS --- */}
      <footer className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-[#FCF8EE] via-[#FCF8EE] to-transparent flex justify-center pb-12 z-20">
        <div className="w-full max-w-2xl flex gap-4">
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isTogglingReady}
            onClick={handleToggleReady}
            className={`flex-1 py-4 text-xl font-bold uppercase tracking-[0.02em] rounded border-2 transition-colors ${
              isCurrentlyReady 
                ? "bg-transparent border-gray-300 text-gray-500 hover:border-gray-400" 
                : "bg-transparent border-[#B81C27] text-[#B81C27] hover:bg-[#B81C27] hover:text-white"
            }`}
          >
            {isCurrentlyReady ? "Unready" : "Ready Up"}
          </motion.button>

          {isHost && (
            <motion.button
              whileHover={allPlayersReady ? { scale: 1.02 } : {}}
              whileTap={allPlayersReady ? { scale: 0.98 } : {}}
              disabled={!allPlayersReady}
              onClick={handleStartGame}
              className={`flex-1 py-4 text-xl font-bold uppercase tracking-[0.02em] rounded transition-colors ${
                allPlayersReady
                  ? "bg-[#B81C27] text-white hover:bg-[#C81C27]"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Start Game
            </motion.button>
          )}

        </div>
      </footer>
    </div>
  );
}