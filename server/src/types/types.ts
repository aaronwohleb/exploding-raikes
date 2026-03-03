/**
 * The user shape returned to the frontend 
 * — intentionally excludes password and Mongoose internals
 */
export interface FrontendUser {
  _id: string;
  username: string;
  email: string;
}


/**
 * Standard wrapper for auth endpoint responses
 */
export interface AuthResponse {
  frontendUser: FrontendUser;
  token: string; // JWT Token
}

/**
 * Frontend state of the lobby.
 */
export interface LobbyState {
  _id: string;
  code: string;
  hostId: string;
  players: FrontendUser[]; 
  readyStatus: Record<string, boolean>; // maps to backend Map<string, boolean>
  maxPlayers: number;
  status: 'waiting' | 'starting' | 'playing' | 'closed';
}