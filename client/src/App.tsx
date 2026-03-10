import React from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { LobbyProvider } from "./context/LobbyContext";
import { GameProvider } from "./context/GameContext";
import MainMenu from "./components/MainMenu";
import JoinLobbyPage from "./components/JoinLobbyPage";
import CreateLobbyPage from "./components/CreateLobbyPage";
import LobbyRoomPage from "./components/LobbyRoomPage";
import InGameScreen from "./components/InGameScreen";


// --- Placeholder Pages (Move these to separate files later) ---

const GamePage = () => (
  <div className="p-10 text-center">
    <h1>Game Room</h1>
  </div>
);
const HowToPage = () => (
  <div className="p-10 text-center">
    <h1>How to Play</h1>
  </div>
);
const ProfilePage = () => (
  <div className="p-10 text-center">
    <h1>This is your Profile stuff</h1>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <LobbyProvider>
            <GameProvider>
              <div className="antialiased font-sans bg-gray-50 min-h-screen">
                <Routes>
                  {/*Define paths */}
                  <Route path="/" element={<MainMenu />} />
                  <Route path="/join" element={<JoinLobbyPage />} />
                  <Route path="/create" element={<CreateLobbyPage />} />
                  <Route path="/lobby/:code" element={<LobbyRoomPage />} />
                  <Route path="/howto" element={<HowToPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/game/:code" element={<InGameScreen />} />
                </Routes>
              </div>
            </GameProvider>
          </LobbyProvider>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
