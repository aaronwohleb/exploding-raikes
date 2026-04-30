export interface UserStats {
  gamesPlayed: number;
  wins: number;
  timesExploded: number;
}

/**
 * The user shape returned to the frontend 
 * — intentionally excludes password and Mongoose internals
 */
export interface FrontendUser {
  _id: string;
  username: string;
  email: string;
  stats?: UserStats;
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
  Bathroom_Drain_Bug = 'Bathroom_Drain_Bug',
  Mega_Bug = 'Mega_Bug',
  Legacy_Bug = 'Legacy_Bug',
  Syntax_Bug = 'Syntax_Bug',
  Heisenbug = 'Heisenbug',
  Defuse = 'Defuse',
  Exploding_Kauffman = 'Exploding_Kauffman',
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
  Five_Card_Combo = 'Five_Card_Combo',
  Replace_Exploding_Kauffman = 'Replace_Exploding_Kauffman',
}


/**
 * Fullstack representation of a Card, used for communication between frontend and backend.
 */
export interface Card {
  id: number;
  name: string;
   type: CardType;
}

/**
 * Represents an action that is currently pending resolution (during the Nope window).
 */
export interface pendingAction {
  playerId: string;
  cards: Card[];
  targetUserId?: string;
  actionType?: CardRequestType;
  requestedCardType?: CardType; // Only used for 3-card combos
}

/**
 * Returned by beginCardPlay so the socket layer knows whether to start the Nope timer
 * immediately or ask the player to pick a target first.
 */
export interface CardPlaySetupResult {
    requiresTarget: boolean;
    cardRequest?: CardRequestType;
}
 
/**
 * Returned by resolvePendingAction so the socket layer knows what to emit.
 */
export interface PendingActionResult {
    noped: boolean;
    sourcePlayerId: string;
  
    futureCards?: Card[];
    /** Present if the player needs to make a post-resolution choice (e.g. 5-card combo discard pick). */
    cardRequest?: CardRequestType;
    /** Present for 5-card combo — the unique card types currently available in the discard pile. */
    availableDiscardTypes?: CardType[];

    pendingFavor?: {
        targetUserId: string;
        sourceUserId: string;
        sourcePlayerName: string;
    };
 
    comboResult?: {
        sourcePlayerId: string;
        targetUserId: string;
        stolenCard: Card | null;       // null = 3-card combo target didn't have the requested type
        requestedType?: CardType;      // what was requested (3-card combo only)
    };
}