import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { currentFrontendUser, logout, updateUsername, deleteAccount } = useAuth();

  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState(currentFrontendUser?.username ?? "");
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentFrontendUser) {
      navigate("/");
    }
  }, [currentFrontendUser, navigate]);

  const handleSaveUsername = async () => {
    if (!currentFrontendUser) return;
    const trimmed = usernameInput.trim();

    if (trimmed.length < 3) {
      setUsernameError("Username must be at least 3 characters.");
      return;
    }
    if (trimmed === currentFrontendUser.username) {
      setIsEditingUsername(false);
      return;
    }

    setIsSavingUsername(true);
    setUsernameError(null);
    try {
      await updateUsername(trimmed); // AuthContext handles the API call + state sync
      setIsEditingUsername(false);
    } catch (err: any) {
      setUsernameError(err?.response?.data?.error || "Failed to update username.");
    } finally {
      setIsSavingUsername(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount();
      navigate("/");
    } catch (err: any) {
      setDeleteError(err?.response?.data?.error || "Failed to delete account.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!currentFrontendUser) return null;

  const stats = currentFrontendUser.stats;
  const gamesPlayed = stats?.gamesPlayed ?? 0;
  const wins = stats?.wins ?? 0;
  const timesExploded = stats?.timesExploded ?? 0;
  const winRate = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0;

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
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-800 transition-colors w-1/3"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm font-bold tracking-widest uppercase">Back to main menu</span>
        </motion.button>

        <motion.h1
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={{ textTransform: "uppercase", letterSpacing: "0.02em", color: "#0F0F0F" }}
          className="text-4xl md:text-5xl font-bold text-center w-1/3"
        >
          Exploding Kauffman
        </motion.h1>

        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-1/3 flex justify-end"
        >
          <button
            onClick={handleLogout}
            className="text-xs font-bold tracking-widest uppercase text-gray-400 hover:text-red-500 transition-colors"
          >
            Logout
          </button>
        </motion.div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 overflow-y-auto px-8 flex flex-col items-center justify-start pt-4 pb-16">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-2xl flex flex-col gap-8"
        >
          {/* --- PROFILE CARD --- */}
          <div className="flex items-center gap-6 p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="w-24 h-24 bg-[#B81C27] rounded-2xl flex items-center justify-center text-white shadow-sm shrink-0">
              <span className="text-5xl font-bold">
                {currentFrontendUser.username.charAt(0).toUpperCase()}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              {!isEditingUsername ? (
                <div className="flex items-center gap-3">
                  <h2 className="text-4xl font-normal text-gray-900 truncate">
                    {currentFrontendUser.username}
                  </h2>
                  <button
                    onClick={() => {
                      setUsernameInput(currentFrontendUser.username);
                      setUsernameError(null);
                      setIsEditingUsername(true);
                    }}
                    className="text-xs font-bold tracking-widest uppercase text-gray-400 hover:text-[#B81C27] transition-colors"
                  >
                    Edit
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      maxLength={20}
                      autoFocus
                      className="flex-1 p-2 text-2xl bg-gray-100 rounded focus:ring-2 focus:ring-[#C81C27] focus:outline-none"
                    />
                    <button
                      onClick={handleSaveUsername}
                      disabled={isSavingUsername}
                      className="px-3 py-2 text-xs font-bold tracking-widest uppercase bg-[#B81C27] text-white rounded hover:bg-[#C81C27] transition-colors disabled:opacity-50"
                    >
                      {isSavingUsername ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingUsername(false);
                        setUsernameError(null);
                      }}
                      className="px-3 py-2 text-xs font-bold tracking-widest uppercase border border-gray-300 text-gray-500 rounded hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                  {usernameError && <p className="text-red-400 text-sm">{usernameError}</p>}
                </div>
              )}
              <p className="text-gray-400 text-lg mt-1 truncate">{currentFrontendUser.email}</p>
            </div>
          </div>

          {/* --- STATS SECTION --- */}
          <section>
            <div className="flex justify-between items-end mb-3 px-2 border-b-2 border-gray-200 pb-2">
              <h3 className="text-2xl font-bold uppercase text-gray-400 tracking-widest">Stats</h3>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3"
            >
              <StatCard label="Games Played" value={gamesPlayed} />
              <StatCard label="Wins" value={wins} />
              <StatCard label="Win Rate" value={`${winRate}%`} />
              <StatCard label="Explosions" value={timesExploded} />
            </motion.div>
          </section>

          {/* --- ACCOUNT SECTION --- */}
          <section>
            <div className="flex justify-between items-end mb-3 px-2 border-b-2 border-gray-200 pb-2">
              <h3 className="text-2xl font-bold uppercase text-gray-400 tracking-widest">Account</h3>
            </div>
            <div className="flex flex-col gap-3">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleLogout}
                className="w-full py-4 text-xl font-bold uppercase tracking-[0.02em] rounded border-2 border-[#B81C27] text-[#B81C27] bg-transparent hover:bg-[#B81C27] hover:text-white transition-colors"
              >
                Log Out
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => {
                  setShowDeleteConfirm(true);
                  setDeleteConfirmText("");
                  setDeleteError(null);
                }}
                className="w-full py-4 text-xl font-bold uppercase tracking-[0.02em] rounded border-2 border-[#B81C27] text-[#B81C27] bg-transparent hover:bg-[#B81C27] hover:text-white transition-colors"
              >
                Delete Account
              </motion.button>
            </div>
          </section>
        </motion.div>
      </main>

      {/* --- DELETE CONFIRMATION MODAL --- */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden z-50 p-8"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">
                Delete Account
              </h2>
              <p className="text-gray-500 text-center mb-6">
                This is permanent. All your data and stats will be erased. Type <span className="font-bold text-red-500">DELETE</span> to confirm.
              </p>

              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                placeholder="Type DELETE"
                className="w-full p-4 text-center text-xl font-mono tracking-widest bg-gray-100 rounded-xl focus:ring-2 focus:ring-red-400 focus:outline-none transition-all uppercase placeholder:text-gray-300"
              />

              <AnimatePresence>
                {deleteError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-red-400 text-sm text-center mt-3"
                  >
                    {deleteError}
                  </motion.p>
                )}
              </AnimatePresence>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 text-lg font-bold uppercase tracking-widest border border-gray-300 text-gray-500 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== "DELETE" || isDeleting}
                  className={`flex-1 py-3 text-lg font-bold uppercase tracking-widest rounded-xl transition-colors ${
                    deleteConfirmText === "DELETE"
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {isDeleting ? "Deleting..." : "Delete Forever"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      className="rounded-xl p-5 flex flex-col items-center justify-center text-center"
      style={{ backgroundColor: "#EDE8DA" }}
    >
      <p className="text-4xl md:text-5xl font-bold text-[#0F0F0F]">{value}</p>
      <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-2">{label}</p>
    </div>
  );
}