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