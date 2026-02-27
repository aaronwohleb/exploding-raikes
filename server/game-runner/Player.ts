class Player {

    private readonly _name: string;
    private readonly _playerNum: number;

    private _hand: Card[];
    private _selectedCards: Card[];
    private _hasNope: boolean;

    private _resolveMove: ((action: PlayerAction) => void) | null = null;
    private _resolveKittenPlacement: ((index: number) => void) | null = null;
    
    /**
     * Constructs a new Player object with a given name and number - also intializes empty hand and selcted cards arrays.
     * 
     * @param name the player's name
     * @param playerNum the player's numbner in play order
     */
    public constructor(name: string, playerNum: number) {
        this._name = name;
        this._playerNum = playerNum;
        this._hand = [];
        this._selectedCards = [];
        this._hasNope = false;
    }

    /**
     * The Frontend calls this when the user clicks "Play Cards" or "Draw Card"
     * 
     * @param action the player's choice to either play some card(s) or to draw
     */
    public handleInput(action: PlayerAction): void {
        if (!this._resolveMove) {
            console.warn(`It is not ${this._name}'s turn or they aren't ready for input.`);
            return;
        }

        const resolve = this._resolveMove;
        this._resolveMove = null; // Guard against double-resolution
        resolve(action);
    }

    /**
     * The Frontend calls this when the user picks a spot in the deck to replace an Exploding Kitten.
     * 
     * @param index the index number for where the Kitten should be placed
     */
    public handleKittenPlacement(index: number): void {
        if (!this._resolveKittenPlacement) {
            console.warn("It is not time to place the kitten in the deck yet");
            return;
        }

        const resolve = this._resolveKittenPlacement;
        this._resolveKittenPlacement = null; // Guard against double-resolution
        resolve(index);
}

    /**
     * Controls the flow of a player's turn. This function allows a player to play as many cards as they'd like before ending the turn with a card draw.
     * 
     * @param game the game state before the turn
     */
    public async takeTurn(game: Game) {
        let turnActive = true;

        while (turnActive) {
            // Wait for the frontend to signal an action
            const action = await new Promise<PlayerAction>((resolve) => {
                this._resolveMove = resolve;
            });

            switch (action.type) {
                case 'PLAY':
                    // Update internal state from the JSON payload
                    this.selectedCards = action.cards /* This is an example, will likely need to select based on passed IDs */;
                    
                    if (this.checkMove()) {
                        this.playSelectedCards(game);
                        console.log("Move successful");
                    } else {
                        console.log("Invalid move");
                        this.selectedCards = [];
                    }
                    // Loop continues: Player can play more cards
                    break;

                case 'DRAW':
                    this.drawCard(game); 
                    turnActive = false; // This breaks the loop and ends takeTurn()
                    break;
            }
        }
    
        console.log(`${this._name}'s turn has officially ended.`);

    }

    /**
     * This function draws a card from the DrawDeck and adds it to this player's hand. Handles Exploding Kitten draws as well.
     * 
     * @param game the game state before the draw
     */
    public async drawCard(game: Game) {
        // TODO: Add undefined checking for shift
        let drawnCard: Card = game.drawDeck.deck.shift()!;
        // TODO: Send card JSON to front end for visuals

        if (drawnCard.type == CardType.Exploding_Kitten) {
            let hasDefuse: boolean = false;
            let currIndex: number = 0;

            while (!hasDefuse && currIndex < this.hand.length) {
                if (this.hand[currIndex].type == CardType.Defuse) {
                    hasDefuse = true;
                }
            }

            if (hasDefuse) {
                let defuse: Card = this.hand.splice(currIndex, 1)[0];
                game.discardPile.pile.unshift(defuse);
                // Query front end for player choice
                const choice = await new Promise<number>((resolve) => {
                    this._resolveKittenPlacement = resolve;
                });
                game.drawDeck.replaceExplodingKitten(drawnCard, choice);
            } else {
                this.lose(game);
            }

        } else {
            if (drawnCard.type == CardType.Nope) {
                this.hasNope = true;
            }
            this.hand.push(drawnCard);
        }
    }

    /**
     * Determines if the SelectedCards are legal to play. Particularly useful for multi-card plays, but will also stop plays like 1 Beard_Cat.
     * 
     * @returns true if legal, false if not
     */
    public checkMove(): boolean {
        switch (this.selectedCards.length) {
            case 1:
                const illegalSingles: CardType[] = [
                    CardType.Beard_Cat,
                    CardType.Catermelon,
                    CardType.Hairy_Potato_Cat,
                    CardType.Rainbow_Ralphing_Cat,
                    CardType.Tacocat,
                    CardType.Defuse,
                    CardType.Exploding_Kitten,
                ];

                return illegalSingles.includes(this.selectedCards[0].type);

            case 2:
                return this.selectedCards[0].type === this.selectedCards[1].type;

            case 3: 
                return this.selectedCards[0].type === this.selectedCards[1].type && this.selectedCards[0].type === this.selectedCards[2].type;

            case 5:
                const typeMap = new Map<CardType, number>();
                for (let card of this.selectedCards) {
                    typeMap.set(card.type, 0);
                }
                return typeMap.size === 5;
        }
        return false;
    }

    /**
     * Handles logic for multi-card combos. Designed to hand off card functionality to Card class for single-card plays.
     * 
     * @param game the game state
     */
    public playSelectedCards(game: Game) {
        switch (this.selectedCards.length) {
            case 1:
                this.selectedCards[0].playCard(game, this);
                break;

            case 2:
                // TODO: Do two-card combo
                for (let card of this.selectedCards) {
                    this.hand = this.hand.filter(currCard => currCard !== card);
                    game.discardPile.pile.unshift(card);
                }
                break;

            case 3: 
                // TODO: Do three-card combo
                for (let card of this.selectedCards) {
                    this.hand = this.hand.filter(currCard => currCard !== card);
                    game.discardPile.pile.unshift(card);
                }
                break;

            case 5:
                // TODO: Do five-card combo (Later)
                for (let card of this.selectedCards) {
                    this.hand = this.hand.filter(currCard => currCard !== card);
                    game.discardPile.pile.unshift(card);
                }
                break;
                
        }
    }

    /**
     * Controls a player's hand and the game's playerList after a player explodes.
     * 
     * @param game the game state
     */
    public lose(game: Game) {
        game.discardPile.pile.unshift(...this.hand);
        // Remove the player from the playerList
        game.playerList = game.playerList.filter(player => player !== this);
        game.numTurns = 0;
    }

    /**
     * Removes the player from the game and subsitutes them with a computer player, which receives their hand.
     */
    public leaveGame() {
        // Leave the game
    }

    /**
     * Adds a player back to the game and replaces the computer opponent, receiving its hand.
     * 
     * NOTE: This function should only be used for a player that has previously disconnected from the game.
     */
    public joinGame() {
        //Join the game
    }

    /**
     * Gets the Player's name.
     * 
     * @return the Player's name
     */
    public get name(): string {
        return this._name;
    }

    /**
     * Gets the Player's number.
     * 
     * @return the Player's number
     */
    public get playerNum(): number {
        return this._playerNum;
    }

    /**
     * Gets the Player's hand.
     * 
     * @return the Player's hand
     */
    public get hand(): Card[] {
        return this._hand;
    }

    /**
     * Sets the Player's hand.
     * 
     * @param value the Player's hand
     */
    public set hand(value: Card[]) {
        this._hand = value;
    }

    /**
     * Gets the Player's selectedCards.
     * 
     * @return the Player's selectedCards
     */
    public get selectedCards(): Card[] {
        return this._selectedCards;
    }

    /**
     * Sets the Player's selectedCards.
     * 
     * @param value the Player's selectedCards
     */
    public set selectedCards(value: Card[]) {
        this._selectedCards = value;
    }

    /**
     * Gets the Player's hasNope status.
     * 
     * @return the Player's hasNope status
     */
    public get hasNope(): boolean {
        return this._hasNope;
    }

    /**
     * Sets the Player's hasNope status.
     * 
     * @param value the Player's hasNope status
     */
    public set hasNope(value: boolean) {
        this._hasNope = value;
    }

    /**
     * 
     */
    public get resolveMove(): ((action: PlayerAction) => void) | null {
        return this._resolveMove;
    }

    /**
     * 
     */
    public set resolveMove(value: ((action: PlayerAction) => void) | null) {
        this._resolveMove = value;
    }

    /**
     * 
     */
    public get resolveKittenPlacement(): ((index: number) => void) | null {
        return this._resolveKittenPlacement;
    }

    /**
     * 
     */
    public set resolveKittenPlacement(value: ((index: number) => void) | null) {
        this._resolveKittenPlacement = value;
    }
}

/**
* Define a simple type for the communication
*/
type PlayerAction = { type: 'PLAY'; cards: Card[]} | { type: 'DRAW' };