import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import MainMenu from './components/MainMenu';

// --- Placeholder Pages (Move these to separate files later) ---
const JoinPage = () => <div className="p-10 text-center"><h1>Join Lobby Page</h1></div>;
const CreatePage = () => <div className="p-10 text-center"><h1>Create Lobby Page</h1></div>;
const GamePage = () => <div className="p-10 text-center"><h1>Game Room</h1></div>;
const HowToPage = () => <div className="p-10 text-center"><h1>How to Play</h1></div>;
const ProfilePage = () => <div className="p-10 text-center"><h1>This is your Profile stuff</h1></div>;


function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="antialiased font-sans bg-gray-50 min-h-screen">
          <Routes>
            {/*Define paths */}
            <Route path="/" element={<MainMenu />} />
            <Route path="/join" element={<JoinPage />} />
            <Route path="/create" element={<CreatePage />} />
            <Route path="/game" element={<GamePage />} />
            <Route path="/howto" element={<HowToPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;