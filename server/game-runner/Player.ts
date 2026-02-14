class Player {

    private readonly _name: string;
    private readonly playerNum: number;

    private hand: Card[];
    private selectedCards: Card[];
    
    public constructor(name: string, playerNum: number) {
        this._name = name;
        this.playerNum = playerNum;
        this.hand = [];
        this.selectedCards = [];
    }

    public takeTurn(game: Game) {
        // Take turn
    }

    public drawCard(game: Game) {
        // Draw a card
    }

    public checkMove(): boolean {
        // Check if legal
        return true;
    }

    public leaveGame() {
        // Leave the fame
    }

    public get name(): string {
        return this._name;
    }


}