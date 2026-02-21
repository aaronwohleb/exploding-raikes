import axios from 'axios';
import { User, AuthResponse } from '../types/types';

// Decided to use axios, can change if you want to
const apiClient = axios.create({
  baseURL: 'http://localhost:3001/api', // Backend URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- AUTH SERVICES ---

export const loginUser = async (email: string, password: string): Promise<User> => {
  // TODO: Verify and login a user (maybe idk)

  const response = await apiClient.post<AuthResponse>("/login", {
    email,
    password
  });

  return response.data.user;
};

export const registerUser = async (username: string, email: string, password: string): Promise<User> => {
  // TODO: Verify and create a user.

  const response = await apiClient.post<AuthResponse>("/register", {
    username,
    email,
    password
  });

  return response.data.user;  
};

// --- GAME SERVICES ---

export const createLobby = async (userId: string): Promise<string> => {
  // Should prolly return the new Room ID
  // Should prolly post the new generated code and check for existing lobby code
  return 'XY99'; // Mock Room Code
};