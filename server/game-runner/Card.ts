/**
 * Defines a game card and its behavior.
 */
class Card {

    private readonly _card: FrontendCard;

    /*
    private readonly _type: CardType;
    private readonly _ID: number;
    private readonly _name: string;
    */

    /**
     * Constructs a new Card object when called containing a card's type, deck ID, and its name.
     * 
     * @param type the Card's type (i.e. Exploding_Kitten)
     * @param ID the Card's deck ID (i.e. 32)
     * @param name the Card's name (i.e. Bob tells you to pivot)
     */
    public constructor(type: CardType, ID: number, name: string) {
        this._type = type;
        this._ID = ID;
        this._name = name;
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
                    
                }
                console.log(`${game.activePlayer.name} has skipped a turn`);
                break;

        }
        return returnCards;
    }

    /**
     * Gets the Card's type.
     * 
     * @return the Card's type
     */
    public get type(): CardType {
        return this._type;
    }

    /**
     * Gets the Card's ID.
     * 
     * @return the Card's ID
     */
    public get ID(): number {
        return this._ID;
    }

    /**
     * Gets the Card's name.
     * 
     * @return the Card's name
     */
    public get name(): string {
        return this._name;
    }
}

/**
 * Represents a Card's possible types.
 */
enum CardType {
    Attack,
    Beard_Cat,
    Catermelon,
    Hairy_Potato_Cat,
    Rainbow_Ralphing_Cat,
    Tacocat,
    Defuse,
    Exploding_Kitten,
    Favor,
    Nope,
    See_the_Future,
    Shuffle,
    Skip
}