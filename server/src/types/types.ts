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

/**
 * Represents a Card's possible types.
 * Uses string values so they survive being sent over the socket as JSON.
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

/**
 * Represents the types of card requests that can be made when a player plays a card that requires additional input.
 */
export enum CardRequestType {
  Favor = 'Favor',
  Two_Card_Combo = 'Two_Card_Combo',
  Three_Card_Combo = 'Three_Card_Combo',
  Replace_Exploding_Kitten = 'Replace_Exploding_Kitten',
}


/**
 * Fullstack representation of a Card, used for communication between frontend and backend.
 */
export interface Card {
  id: number;
  name: string;
   type: CardType;
}