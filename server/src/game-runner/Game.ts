/**
 * Responsible for holding the game state and running the game.
 */
class Game {

    private _playerList: Player[];
    private _drawDeck: DrawDeck;
    private _discardPile: DiscardPile;
    private _activePlayer: Player;
    private _numTurns: number;

    /**
     * Constructs a new Game object when called containing a player list and a default game state.
     * 
     * @param playerList the list of players playing the game
     */
    public constructor(playerList: Player[]) {
        this._playerList = playerList;
        this._drawDeck = new DrawDeck();
        this._discardPile = new DiscardPile();
        this._activePlayer = this.playerList[0];
        this._numTurns = 1;

        this.dealCards();
    }

    /**
     * Controls the flow of the game - turn order, game state, victory, etc.
     * 
     * @returns the winner of the game
     */
    public playGame(): Player {
        // Play game
        return this.playerList[0];
    }

    /**
     * Helper function to deal a starting hand to each player. A starting hand should have 7 non-defuse, non-exploding kitten cards, and 1 defuse.
     */
    public dealCards() {
        //Deal starting hands
    }

    /**
     * Gets the game's playerList.
     * 
     * @return the playerList
     */
    public get playerList(): Player[] {
        return this._playerList;
    }

    /**
     * Sets the game's playerlist.
     * 
     * @param value the edited playerList
     */
    public set playerList(value: Player[]) {
        this._playerList = value;
    }

    /**
     * Gets the game's drawDeck.
     * 
     * @return the drawDeck
     */
    public get drawDeck(): DrawDeck {
        return this._drawDeck;
    }

    /**
     * Sets the game's drawDeck.
     * 
     * @param value the edited drawDeck
     */
    public set drawDeck(value: DrawDeck) {
        this._drawDeck = value;
    }

    /**
     * Gets the game's discardPile.
     * 
     * @return the discardPile
     */
    public get discardPile(): DiscardPile {
        return this._discardPile;
    }

    /**
     * Sets the game's playerlist.
     * 
     * @param value the edited discardPile
     */
    public set discardPile(value: DiscardPile) {
        this._discardPile = value;
    }

    /**
     * Gets the game's activePlayer.
     * 
     * @return the activePlayer
     */
    public get activePlayer(): Player {
        return this._activePlayer;
    }

    /**
     * Sets the game's activePlayer.
     * 
     * @param value the edited activePlayer
     */
    public set activePlayer(value: Player) {
        this._activePlayer = value;
    }

    /**
     * Gets the game's turns remaining counter.
     * 
     * @return the turns remaining counter
     */
    public get numTurns(): number {
        return this._numTurns;
    }

    /**
     * Sets the game's turns remaining counter.
     * 
     * @param value the edited turns remaining counter
     */
    public set numTurns(value: number) {
        this._numTurns = value;
    }
}