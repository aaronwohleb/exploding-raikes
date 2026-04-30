import axios from 'axios';
import { AuthResponse, FrontendUser, LobbyState } from '../types/types';

// Axios instance configured to point at the local backend
const apiClient = axios.create({
  baseURL: 'http://localhost:3001/api', // Backend URL
  headers: {
    'Content-Type': 'application/json',
  },
});


apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    // Attach the JWT token to the Authorization header
    config.headers.Authorization = `Bearer ${token}`; 
  }
  return config;
}, (error) => {
  return Promise.reject(error);
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

// USER / PROFILE SERVICES
 
/**
 * Updates the current user's username.
 * Returns the updated user object.
 */
export const updateUsername = async (
  userId: string,
  username: string
): Promise<FrontendUser> => {
  const response = await apiClient.patch<FrontendUser>(`/users/${userId}`, {
    username,
  });
  return response.data;
};

/**
 * Permanently deletes the user's account.
 * Backend route: DELETE /api/users/:userId
 */
export const deleteAccount = async (userId: string): Promise<void> => {
  await apiClient.delete(`/users/${userId}`);
};

 // LOBBY SERVICES

/**
 * Tells the backend to create a new lobby and returns the generated code.
 */
export const createLobby = async (userId: string, maxPlayers: number = 8): Promise<LobbyState> => {
  const response = await apiClient.post("/lobbies", {
    userId,
    maxPlayers
  });
  console.log("RAW CREATE DATA FROM BACKEND:", response.data);
  // Pull the lobby code out of the response
  return response.data; 
};

/**
 * Attempts to join an existing lobby by code.
 */
export const joinLobby = async (code: string, userId: string): Promise<LobbyState> => {
  const response = await apiClient.post("/lobbies/join", {
    code,
    userId
  });
  
  return response.data;
};

export const updateReadyStatus = async (code: string, userId: string, isReady: boolean): Promise<LobbyState> => {
  const response = await apiClient.patch<LobbyState>(`/lobbies/${code}/players/${userId}/ready`, {
    isReady
  });
  return response.data;
};

export const leaveLobby = async (code: string, userId: string): Promise<void> => {
  await apiClient.delete(`/lobbies/${code}/players/${userId}`);
};