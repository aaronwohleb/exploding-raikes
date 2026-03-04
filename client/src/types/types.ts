export interface FrontendUser {
  _id: string;
  username: string;
  email: string;
//   stats?: {
//     wins: number;
//     gamesPlayed: number;
//   };
}

export interface GameState {
  roomId: string;
  players: FrontendUser[];
  activePlayerId: string;
  gameStatus: 'LOBBY' | 'PLAYING' | 'GAME_OVER';
  // Add other game specific fields
}

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