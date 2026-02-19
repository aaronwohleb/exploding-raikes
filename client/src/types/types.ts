export interface User {
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
  players: User[];
  activePlayerId: string;
  gameStatus: 'LOBBY' | 'PLAYING' | 'GAME_OVER';
  // Add other game specific fields
}

export interface AuthResponse {
  user: User;
  token: string; // JWT Token
}