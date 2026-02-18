import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function JoinLobbyPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [lobbyCode, setLobbyCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lobbyCode.trim()) return;

    if (lobbyCode.trim().length !== 6) {
      setError("Code must be exactly 6 characters.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      // TODO: replace with your actual API call
      // await joinLobby(lobbyCode.trim().toUpperCase());
      await new Promise((res) => setTimeout(res, 800)); // simulated delay
      navigate(`/lobby/${lobbyCode.trim().toUpperCase()}`);
    } catch (err) {
      setError("Lobby not found. Check your code and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="relative w-full h-screen overflow-hidden selection:bg-red-100"
      style={{
        backgroundColor: "#FCF8EE",
        color: "#0F0F0F",
        fontFamily: '"bebas-neue-pro-semiexpanded", sans-serif',
      }}
    >
      <header className="absolute top-0 left-0 w-full p-8 flex justify-between items-start z-10">
        {/* Back button */}
        <motion.button
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-800 transition-colors w-1/3"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm font-bold tracking-widest uppercase">
            Back to main menu
          </span>
        </motion.button>

        {/* Title — centered in the middle third */}
        <motion.h1
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={{
            textTransform: "uppercase",
            letterSpacing: "0.02em",
            color: "#0F0F0F",
          }}
          className="text-4xl md:text-5xl font-bold text-center w-1/3"
        >
          Exploding Kauffman
        </motion.h1>

        {/* User display */}
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-1/3 flex justify-end"
        >
          {user && (
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center gap-3 p-2 group"
            >
              <div className="text-right">
                <p className="text-xl font-medium text-gray-900 group-hover:text-red-400 transition-colors">
                  {user.username}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-300 rounded-xl flex items-center justify-center text-white shadow-sm group-hover:bg-red-400 transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </button>
          )}
        </motion.div>
      </header>

      <main className="flex flex-col items-center justify-center h-full w-full px-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-6 w-full max-w-xs"
        >
          {/* Heading */}
          <div className="text-center">
            <h2 className="text-5xl font-normal text-gray-900">Join a Lobby</h2>
            <p className="text-gray-400 mt-1 text-xl">
              Enter the code shared by your host
            </p>
          </div>

          <form onSubmit={handleJoin} className="w-full flex flex-col gap-4">
            {/* Code input */}
            <input
              type="text"
              value={lobbyCode}
              onChange={(e) => {
                setError(null);
                // A-Z and 0-9, auto-uppercase
                setLobbyCode(
                  e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
                );
              }}
              maxLength={8}
              placeholder="e.g. ABC123"
              autoFocus
              className="w-full p-4 text-center text-2xl font-mono tracking-widest bg-gray-100 rounded-xl focus:ring-2 focus:ring-black focus:outline-none transition-all uppercase placeholder:text-gray-300 placeholder:text-xl"
            />
            <p
              className={`text-right text-xs font-mono tracking-widest transition-colors ${
                lobbyCode.length === 6 ? "text-green-400" : "text-red-300"
              }`}
            >
              {lobbyCode.length} / 6
            </p>

            {/* Error message — animates in on failure */}
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-red-400 text-sm text-center"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Submit button (don't work till smt typed*/}
            <motion.button
              type="submit"
              disabled={isLoading || !lobbyCode.trim()}
              whileHover={{ scale: lobbyCode.trim() ? 1.02 : 1 }}
              whileTap={{ scale: lobbyCode.trim() ? 0.98 : 1 }}
              className="w-full py-4 text-xl font-bold"
              style={{
                backgroundColor: lobbyCode.trim() ? "#B81C27" : "#B9B9B9",
                color: "#FCF8EE",
                textTransform: "uppercase",
                letterSpacing: "0.02em",
                borderRadius: "4px",
              }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  Joining...
                </span>
              ) : (
                "Join Lobby"
              )}
            </motion.button>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
