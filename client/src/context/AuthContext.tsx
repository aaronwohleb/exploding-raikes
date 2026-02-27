import React, { createContext, useContext, useState, ReactNode } from 'react';
import { FrontendUser }  from "../types/types"
import * as api from '../services/api';


// Define Auth Context
interface AuthContextType {
  currentFrontendUser: FrontendUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FrontendUser | null>(null);

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

  return (
    <AuthContext.Provider value={{ currentFrontendUser: user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};