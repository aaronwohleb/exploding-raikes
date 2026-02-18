import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// getting a random 6-character code like "A3X9KQ"
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(
    { length: 6 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
}
// we can change this accordingly and figure how to store i just wanted to see what this would look like

export default function CreateLobbyPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [lobbyCode, setLobbyCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const code = generateCode();

      // TODO: register the lobby on your backend
      // await createLobby({ code, maxPlayers: 8 });

      await new Promise((res) => setTimeout(res, 700)); // simulated delay
      setLobbyCode(code);
    } catch (err) {
      setError("Failed to create lobby. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!lobbyCode) return;
    navigator.clipboard.writeText(lobbyCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEnterLobby = () => {
    if (!lobbyCode) return;
    navigate(`/lobby/${lobbyCode}`);
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
      {/* --- HEADER --- */}
      <header className="absolute top-0 left-0 w-full p-8 flex justify-between items-start z-10">
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
                <p className="text-xl font-medium text-gray-900 group-hover:text-[#B81C27] transition-colors">
                  {user.username}
                </p>
              </div>
              <div className="w-12 h-12 bg-[#B81C27] rounded-xl flex items-center justify-center text-white shadow-sm group-hover:bg-[#C81C27] transition-colors">
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

      {/* --- MAIN CONTENT --- */}
      <main className="flex flex-col items-center justify-center h-full w-full px-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-6 w-full max-w-xs"
        >
          <AnimatePresence mode="wait">
            {/* ── BEFORE CODE IS GENERATED ── */}
            {!lobbyCode ? (
              <motion.div
                key="pre"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center gap-6 w-full"
              >
                <div className="text-center">
                  <h2 className="text-5xl font-normal text-gray-900">
                    Create a Lobby
                  </h2>
                  <p className="text-gray-400 mt-1 text-xl">
                    Up to 8 players can join with your code
                  </p>
                </div>

                <form
                  onSubmit={handleCreate}
                  className="w-full flex flex-col gap-4"
                >
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

                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 text-xl font-bold rounded shadow-sm transition-colors"
                    style={{
                      backgroundColor: "#B81C27",
                      color: "#FCF8EE",
                      textTransform: "uppercase",
                      letterSpacing: "0.02em",
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
                        Generating...
                      </span>
                    ) : (
                      "Create Lobby"
                    )}
                  </motion.button>
                </form>
              </motion.div>
            ) : (
              /* ── AFTER CODE IS GENERATED ── */
              <motion.div
                key="post"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center gap-6 w-full"
              >
                <div className="text-center">
                  <h2 className="text-5xl font-normal text-gray-900">
                    Lobby Created!
                  </h2>
                  <p className="text-gray-400 mt-1 text-xl">
                    Share this code with up to 8 friends
                  </p>
                </div>

                {/* The generated code display */}
                <div
                  className="w-full rounded p-6 text-center"
                  style={{ backgroundColor: "#EDE8DA" }}
                >
                  <p
                    className="text-5xl font-mono font-bold tracking-[0.3em]"
                    style={{ color: "#0F0F0F" }}
                  >
                    {lobbyCode}
                  </p>
                </div>

                {/* Copy to clipboard button */}
                <motion.button
                  onClick={handleCopy}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-1.5 text-sm font-bold tracking-widest uppercase transition-colors"
                  style={{
                    border: "1px solid #B81C27",
                    color: copied ? "#FCF8EE" : "#B81C27",
                    backgroundColor: copied ? "#C84B55" : "transparent",
                    borderRadius: "2px",
                  }}
                >
                  {copied ? "✓ Copied!" : "Copy Code"}
                </motion.button>

                {/* Enter lobby button */}
                <motion.button
                  onClick={handleEnterLobby}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 text-xl font-bold transition-colors"
                  style={{
                    backgroundColor: "#B81C27",
                    color: "#FCF8EE",
                    textTransform: "uppercase",
                    letterSpacing: "0.02em",
                    borderRadius: "4px",
                  }}
                >
                  Enter Lobby
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>
    </div>
  );
}
