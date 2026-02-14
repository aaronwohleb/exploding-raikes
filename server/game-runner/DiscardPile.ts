/**
 * Represents a deck of Exploding Kittens cards with the functionality of the game's discard pile.
 */
class DiscardPile {

    private _pile: Card[];

    /**
     * Constructs a DiscardPile object with an empty pile
     */
    public constructor() {
        this._pile = [];
    }

    /**
     * Allows the specified player to draw a card of their choice from the discard pile.
     * 
     * @param player the player that will draw the card
     */
    public drawFromDiscard(player: Player) {
        // draw card of choice from DCP
    }

    /**
     * Gets the DiscardPile object's pile.
     * 
     * @return the Card's type
     */
    public get pile(): Card[] {
        return this._pile;
    }

    /**
     * Sets the DiscardPile object's pile.
     * 
     * @param value the edited pile.
     */
    public set pile(value: Card[]) {
        this._pile = value;
    }
}