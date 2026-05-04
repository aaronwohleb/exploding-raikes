import { Game } from './Game';
import { Player } from './Player';

export class GameManager {
    private static instance: GameManager;
    
    private activeGames = new Map<string, Game>();

    private constructor() {
        
    }

    public static getInstance(): GameManager {
        if (!GameManager.instance) {
            GameManager.instance = new GameManager();
        }
        return GameManager.instance;
    }

    public createGame(roomId: string, playerList: Player[]) {
        const game = new Game(playerList);
        this.activeGames.set(roomId, game);
    }

    public getGame(roomId: string): Game | undefined {
        return this.activeGames.get(roomId);
    }
}