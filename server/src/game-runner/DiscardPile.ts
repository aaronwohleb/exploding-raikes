import { Card } from '../types/types';
import { Player } from './Player';

/**
 * Represents a deck of Exploding Kittens cards with the functionality of the game's discard pile.
 */
export class DiscardPile {

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
    public drawFromDiscard(player: Player, index: number) {
        let cardChoice: Card = this.pile.splice(index, 1)[0];
        player.hand.push(cardChoice);
    }

    public get pile(): Card[] { return this._pile; }
    public set pile(value: Card[]) { this._pile = value; }

    public addCards(cards: Card[]) {
        this._pile.push(...cards);
    }

    public get topCard(): Card | null {
        return this._pile.length > 0 ? this._pile[this._pile.length - 1] : null;
    }
}