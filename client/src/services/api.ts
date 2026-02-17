import axios from 'axios';
import { User, AuthResponse } from '../types/models';

// Decided to use axios, can change if you want to
const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api', // Backend URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- AUTH SERVICES ---

export const loginUser = async (email: string, password: string): Promise<User> => {
  // TODO: Verify and login a user (maybe idk)

  // TEMPORARY MOCK LOGIN (Remove when backend is ready)
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        _id: 'mock_user_id',
        username: 'bossman67',
        email: email,
      });
    }, 500);
  });
};

export const registerUser = async (username: string, email: string, password: string): Promise<User> => {
  // TODO: Verify and create a user.


  // TEMPORARY MOCK AUTOLOGIN
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        _id: 'mock_' + Date.now(),
        username,
        email,
      });
    }, 500);
  });
};

// --- GAME SERVICES ---

export const createLobby = async (userId: string): Promise<string> => {
  // Should prolly return the new Room ID
  // Should prolly post the new generated code and check for existing lobby code
  return 'XY99'; // Mock Room Code
};