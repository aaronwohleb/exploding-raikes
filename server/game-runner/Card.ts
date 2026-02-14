/**
 * Defines a game card and its behavior.
 */
class Card {

    private readonly _type: CardType;
    private readonly _ID: number;
    private readonly _name: string;

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
     * @param target the target of the Card's effects
     * @returns an action code, which will affect the state of the game after the function executes
     */
    public playCard(game: Game, target: Player): number {
        // play card with a target
        return 0;
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