export interface FrontedUser {
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
  players: FrontedUser[];
  activePlayerId: string;
  gameStatus: 'LOBBY' | 'PLAYING' | 'GAME_OVER';
  // Add other game specific fields
}

export interface AuthResponse {
  user: FrontedUser;
  token: string; // JWT Token
}