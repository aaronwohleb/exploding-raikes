class Player {

    private readonly _name: string;
    private readonly _playerNum: number;

    private _hand: Card[];
    private _selectedCards: Card[];
    private _hasNope: boolean;
    
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
     * Controls the flow of a player's turn. This function allows a player to play as many cards as they'd like before ending the turn with a card draw.
     * 
     * @param game the game state before the turn
     */
    /*
    NOTE: Superfluous unless deemed otherwise - commented out just in case
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
                    this.selectedCards = action.cards  This is an example, will likely need to select based on passed IDs ;
                    
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
    */

    /**
     * This function draws a card from the DrawDeck and adds it to this player's hand. Handles Exploding Kitten draws as well.
     * 
     * @param game the game state before the draw
     */
    public async drawCard(game: Game) {
        //TODO: Determine if async or if using websockets
        //TODO: Add undefined checking for shift
        let drawnCard: Card = game.drawDeck.deck.shift()!;

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
                //TODO: Query FrontEnd for choice
                let choice: number = 0; // temporary
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
                return typeMap.size == 5;
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
                //TODO: Query frontend for target if favor (Maybe targeted attack later)
                this.selectedCards[0].playCard(game, this);
                break;

            case 2:
                //TODO: Do two-card combo
                for (let card of this.selectedCards) {
                    this.hand = this.hand.filter(currCard => currCard !== card);
                    game.discardPile.pile.unshift(card);
                }
                break;

            case 3: 
                //TODO: Do three-card combo
                for (let card of this.selectedCards) {
                    this.hand = this.hand.filter(currCard => currCard !== card);
                    game.discardPile.pile.unshift(card);
                }
                break;

            case 5:
                //TODO: Do five-card combo (Later)
                for (let card of this.selectedCards) {
                    this.hand = this.hand.filter(currCard => currCard !== card);
                    game.discardPile.pile.unshift(card);
                }
                break;
                
        }
    }

    /**
     * This function applies the Card's effects to the game.
     * 
     * @param game the game being played on which to apply the Card's effects
     * @param target the target of the Card's effects NOTE: for no target, the target is the current player
     * @returns an action code, which will affect the state of the game after the function executes
     */
    public playCard(game: Game, target: Player): Card[] {
        // play card with a target
        let returnCards: Card[] = [];
        switch (this._card.type) {
            case CardType.Attack: 
                // NOTE: game.numTurns MUST be 0 before a player's chance to play/draw ends
                if (game.numTurns > 1) {
                    // TODO: store attack turns statically so that they can be added after consecutive turns
                    game.numTurns--;
                    console.log(`${game.activePlayer} just attacked, but they still have more turns. Successfully stored attack info`);
                } else {
                    game.numTurns = 2 /* + stored attacks */
                    try {
                        game.activePlayer = game.playerList[game.playerList.indexOf(game.activePlayer) + 1];
                        console.log(`${game.activePlayer} successfully attacked and ended their turn`);
                    } catch (error: unknown) {
                        if (error instanceof Error) {
                            // Index out of bounds error: loop playerList
                            game.activePlayer = game.playerList[0];
                        } else {
                            console.error("Unkown error occured in playCard{Attack}");
                        }
                    }
                }
                break;  
                
            case CardType.Beard_Cat:
                console.warn("You cannot play CardType.Beard_Cat alone");
                break;

            case CardType.Catermelon:
                console.warn("You cannot play CardType.Catermelon alone");
                break;

            case CardType.Hairy_Potato_Cat:
                console.warn("You cannot play CardType.Hairy_Potato_Cat alone");
                break;

            case CardType.Rainbow_Ralphing_Cat:
                console.warn("You cannot play CardType.Rainbow_Ralphing_Cat alone");
                break;

            case CardType.Tacocat:
                console.warn("You cannot play CardType.Tacocat alone");
                break;

            case CardType.Defuse:
                console.warn("You cannot play CardType.Defuse alone");
                break;

            case CardType.Exploding_Kitten:
                console.warn("You cannot play CardType.Exploding_Kitten");
                break;

            case CardType.Favor:
                //TODO: Query Frontend for player selection (both target and card)
                const receievedCard = target.hand.splice(0, 1)[0]; // temporary
                game.activePlayer.hand.push(receievedCard);
                console.log(`${game.activePlayer.name} succesfully asked a favor from ${target.name} and received a ${receievedCard.type.toString}`);
                break;
                
            case CardType.Nope:
                //TODO: Implement before R2

            case CardType.See_the_Future:
                returnCards = game.drawDeck.seeFuture(3);
                console.log(`${game.activePlayer.name} just saw the future (x3)`);
                break;

            case CardType.Shuffle:
                game.drawDeck.shuffleDeck();
                console.log("Shuffled draw deck");
                break;

            case CardType.Skip:
                game.numTurns--;
                if (game.numTurns == 0) {
                    try {
                        game.activePlayer = game.playerList[game.playerList.indexOf(game.activePlayer) + 1];
                        console.log(`${game.activePlayer} successfully skipped and ended their turn`);
                    } catch (error: unknown) {
                        if (error instanceof Error) {
                            // Index out of bounds error: loop playerList
                            game.activePlayer = game.playerList[0];
                        } else {
                            console.error("Unkown error occured in playCard{Attack}");
                        }
                    }
                }
                console.log(`${game.activePlayer.name} has skipped a turn`);
                break;

        }
        return returnCards;
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
}