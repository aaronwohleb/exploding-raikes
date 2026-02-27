import axios from 'axios';
import { AuthResponse } from '../types/types';

// Axios instance configured to point at the local backend
const apiClient = axios.create({
  baseURL: 'http://localhost:3001/api', // Backend URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// AUTH SERVICES

/**
 * Sends login credentials to the backend and returns 
 * the authenticated frontend user
 * @param email 
 * @param password 
 * @returns authenticated frontend user object and JWT token
 */
export const loginUser = async (email: string, password: string): Promise<AuthResponse> => {

  const response = await apiClient.post<AuthResponse>("/login", {
    email,
    password
  });

  return response.data;
};

/**
 * Sends registration details to the backend and 
 * returns the newly created frontend user
 * @param username 
 * @param email 
 * @param password 
 * @returns frontend user
 */
export const registerUser = async (username: string, email: string, password: string): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>("/register", {
    username,
    email,
    password
  });

  return response.data;  
};
 // GAME SERVICES

export const createLobby = async (userId: string): Promise<string> => {
  // Should prolly return the new Room ID
  // Should prolly post the new generated code and check for existing lobby code
  return 'XY99'; // Mock Room Code
};