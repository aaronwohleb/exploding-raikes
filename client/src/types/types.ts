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

/**
 * Mirror of the server-side CardType enum in card.ts.
 * Uses string values so they survive being sent over the socket as JSON.
 * Keep in sync with the server.
 */
export enum CardType {
  Attack = 'Attack',
  Beard_Cat = 'Beard_Cat',
  Catermelon = 'Catermelon',
  Hairy_Potato_Cat = 'Hairy_Potato_Cat',
  Rainbow_Ralphing_Cat = 'Rainbow_Ralphing_Cat',
  Tacocat = 'Tacocat',
  Defuse = 'Defuse',
  Exploding_Kitten = 'Exploding_Kitten',
  Favor = 'Favor',
  Nope = 'Nope',
  See_the_Future = 'See_the_Future',
  Shuffle = 'Shuffle',
  Skip = 'Skip',
}

export interface FrontendCard {
  id: number;
  name: string;
   type: CardType;
}

export interface PlayedCard {
  id: string;
  type: CardType;
  // All cards involved in this play
  cards: FrontendCard[];
}