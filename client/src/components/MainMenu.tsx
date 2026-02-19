import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function MainMenu() {
  const navigate = useNavigate();
  const { user, login, register, logout } = useAuth();

  // Local UI State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"LOGIN" | "REGISTER">("LOGIN");

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [usernameInput, setUsernameInput] = useState("");

  // Audio State (Visual only)
  const [musicVol, setMusicVol] = useState(50);
  const [sfxVol, setSfxVol] = useState(75);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (authMode === "LOGIN") {
        // This now triggers the service in api.ts
        await login(email, password);
      } else {
        // This sends the username, email, and password
        await register(usernameInput, email, password);
      }
      setShowAuthModal(false);
    } catch (err) {
      alert("Authentication failed. Please try again.");
    }
  };

  return (
    <div className="relative w-full h-screen bg-[#FCF8EE] text-gray-800 font-sans overflow-hidden selection:bg-red-100">
      {/* --- TOP HEADER --- */}
      <header className="absolute top-0 left-0 w-full p-8 flex justify-between items-start z-10">
        <div className="w-1/3"></div> {/* Spacer for balance */}
        {/* Title */}
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
        {/* User Profile (Top Right) */}
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-1/3 flex justify-end"
        >
          {user ? (
            <div className="flex flex-col items-end gap-1">
              {/* Profile Link: Clicking the name or image takes you to /profile */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/profile")}
                className="flex items-center gap-3 p-2 group"
              >
                <div className="text-right">
                  <p className="text-xl font-medium text-gray-900 group-hover:text-[#B81C27] transition-colors">
                    {user.username}
                  </p>
                </div>

                {/* Avatar Square as a Button */}
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
              </motion.button>

              {/* Logout Button remains separate below */}
              <button
                onClick={logout}
                className="text-xs font-bold tracking-widest uppercase text-gray-400 hover:text-red-500 transition-colors mr-3"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setAuthMode("LOGIN");
                setShowAuthModal(true);
              }}
              className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-xl transition-colors"
            >
              <span className="text-xl font-medium text-gray-900">Login</span>
              <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center text-gray-500">
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

      {/* --- CENTER BUTTONS --- */}
      <main className="flex flex-col items-center justify-center h-full w-full px-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col gap-4 max-w-xs"
        >
          {" "}
          {/* User has to be logged in to join/create a game */}
          <MenuButton
            onClick={() => (user ? navigate("/join") : setShowAuthModal(true))}
          >
            Join Lobby
          </MenuButton>
          <MenuButton
            onClick={() =>
              user ? navigate("/create") : setShowAuthModal(true)
            }
          >
            Create Lobby
          </MenuButton>
          <MenuButton onClick={() => navigate("/howto")}>
            How to Play
          </MenuButton>
        </motion.div>
      </main>

      {/* --- BOTTOM LEFT AUDIO SLIDERS --- */}
      <motion.div
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="absolute bottom-10 left-10 flex flex-col gap-6"
      >
        <VolumeSlider label="Music" value={musicVol} onChange={setMusicVol} />
        <VolumeSlider label="SFX" value={sfxVol} onChange={setSfxVol} />
      </motion.div>

      {/* --- AUTH MODAL --- */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAuthModal(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden z-50 p-8"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">
                {authMode === "LOGIN" ? "Welcome Back" : "Create Account"}
              </h2>

              <form
                onSubmit={handleAuthSubmit}
                className="mt-6 flex flex-col gap-4"
              >
                {authMode === "REGISTER" && (
                  <input
                    required
                    type="text"
                    className="w-full p-4 bg-gray-100 rounded-xl focus:ring-2 focus:ring-[#C81C27] focus:outline-none transition-all"
                    placeholder="Username"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                  />
                )}

                <input
                  required
                  type="email"
                  className="w-full p-4 bg-gray-100 rounded-xl focus:ring-2 focus:ring-[#C81C27] focus:outline-none transition-all"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <input
                  required
                  type="password"
                  className="w-full p-4 bg-gray-100 rounded-xl focus:ring-2 focus:ring-[#C81C27] focus:outline-none transition-all"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <button className="mt-4 w-full bg-[#B81C27] hover:bg-[#C81C27] text-[#FCF8EE] font-medium text-lg py-4 rounded-xl transition-colors">
                  {authMode === "LOGIN" ? "Login" : "Sign Up"}
                </button>
              </form>

              <div className="text-center mt-6">
                <button
                  type="button"
                  onClick={() =>
                    setAuthMode(authMode === "LOGIN" ? "REGISTER" : "LOGIN")
                  }
                  className="text-gray-500 hover:text-[#B81C27] text-sm font-medium transition-colors"
                >
                  {authMode === "LOGIN"
                    ? "Create an account"
                    : "Already have an account? Login"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- FLAT STYLE SUBCOMPONENTS ---

function MenuButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-64 py-4 text-xl font-normal text-[#FCF8EE] bg-[#B81C27] hover:bg-[#C81C27] rounded-[4px] shadow-sm transition-colors"
    >
      {children}
    </motion.button>
  );
}

function VolumeSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2 w-48">
      <span className="text-xl font-normal text-gray-900">{label}</span>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#B81C27]"
      />
    </div>
  );
}
