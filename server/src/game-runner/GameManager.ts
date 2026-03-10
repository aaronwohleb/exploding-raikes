import { Game } from './Game';
import { Player } from './Player';

/**
 * Global in-memory store for all active games.
 * Key: roomId (string)
 * Value: Game instance
 */

export class GameManager {
    private static instance: GameManager;
    private  activeGames = new Map<string, Game>();
    constructor(){
        this.activeGames = new Map<string, Game>();
    }

    public static getInstance(): GameManager {
        if (!GameManager.instance) {
            GameManager.instance = new GameManager();
        }
        return GameManager.instance;
    }

    public createGame(roomId: string, playerList: Player[]) {
        if(this.activeGames.has(roomId)) {
            throw new Error(`Game with roomId ${roomId} already exists.`);
        }
        const game = new Game(playerList);
        this.activeGames.set(roomId, game);
    }

}