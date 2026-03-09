import { Game } from './Game';

/**
 * Global in-memory store for all active games.
 * Key: roomId (string)
 * Value: Game instance
 */
export const activeGames = new Map<string, Game>();