import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FrontendUser }  from "../types/types"
import * as api from '../services/api';


// Define Auth Context
interface AuthContextType {
  currentFrontendUser: FrontendUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUsername: (newUsername: string) => Promise<void>;

  refreshUser: () => void; // function to pull user info from server and update context
  patchUser: (patch: Partial<FrontendUser>) => void;
  /**
   * Permanently deletes the user's account on the backend, clears token and state.
   * Throws on failure so the caller can surface an error.
   */
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FrontendUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, attempt to restore the session from a stored JWT
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }
    api.getMe()
      .then((frontendUser) => setUser(frontendUser))
      .catch(() => localStorage.removeItem('token')) // expired or invalid
      .finally()
  }, []);

  const login = async (email: string, password: string) => {
    const {frontendUser, token} = await api.loginUser(email, password);
    localStorage.setItem('token', token); // Store JWT token for future authenticated requests
    setUser(frontendUser); // Update context with the authenticated user
  };

  const register = async (username: string, email: string, password: string) => {
    const {frontendUser, token} = await api.registerUser(username, email, password);
    localStorage.setItem('token', token); // Store JWT token for future authenticated requests
    setUser(frontendUser); // Update context with the registered user
  };

  const logout = () => {
    localStorage.removeItem('token'); // Clear JWT token from storage
    setUser(null);
  }

  const updateUsername = async (newUsername: string) => {
    if (!user) throw new Error("Can't update username: no user is logged in.");
    const updated = await api.updateUsername(user._id, newUsername);
    setUser(updated); // Sync context with server's authoritative response
  };

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error("No token found");
      
      const updatedUser = await api.getMe();
      setUser(updatedUser); 
    } catch (error) {
      console.error("Failed to refresh user data:", error);
    }
  };

  const patchUser = (patch: Partial<FrontendUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      return { ...prev, ...patch };
    });
  };

  const deleteAccount = async () => {
    if (!user) throw new Error("Can't delete account: no user is logged in.");
    await api.deleteAccount(user._id);
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentFrontendUser: user, login, register, logout, updateUsername, refreshUser, patchUser, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
