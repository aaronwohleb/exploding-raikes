import { Card, CardType } from '../types/types';
/**
 * Represents a deck of Exploding Kittens cards with the functionality of the game's draw pile.
 */
export class DrawDeck {

    private _deck: Card[];

    /**
     * Builds a full deck of Exploding Kittens Cards.
     */
    public constructor() {
        this._deck = [];
        // Make full deck of cards
        for (let i: number = 0; i < 4; i++) {
            this._deck.push({ type: CardType.Attack, id: i, name: "Generic" });
        }
        for (let i: number = 4; i < 8; i++) {
            this._deck.push({ type: CardType.Beard_Cat, id: i, name: "Generic" });
        }
        for (let i: number = 8; i < 12; i++) {
            this._deck.push({ type: CardType.Catermelon, id: i, name: "Generic" });
        }
        for (let i: number = 12; i < 16; i++) {
            this._deck.push({ type: CardType.Hairy_Potato_Cat, id: i, name: "Generic" });
        }
        for (let i: number = 16; i < 20; i++) {
            this._deck.push({ type: CardType.Rainbow_Ralphing_Cat, id: i, name: "Generic" });
        }
        for (let i: number = 20; i < 24; i++) {
            this._deck.push({ type: CardType.Tacocat, id: i, name: "Generic" });
        }
        for (let i: number = 24; i < 30; i++) {
            this._deck.push({ type: CardType.Defuse, id: i, name: "Generic" });
        }
        for (let i: number = 30; i < 34; i++) {
            this._deck.push({ type: CardType.Exploding_Kitten, id: i, name: "Generic" });
        }
        for (let i: number = 34; i < 38; i++) {
            this._deck.push({ type: CardType.Favor, id: i, name: "Generic" });
        }
        for (let i: number = 38; i < 43; i++) {
            this._deck.push({ type: CardType.Nope, id: i, name: "Generic" });
        }
        for (let i: number = 43; i < 48; i++) {
            this._deck.push({ type: CardType.See_the_Future, id: i, name: "Generic" });
        }
        for (let i: number = 48; i < 52; i++) {
            this._deck.push({ type: CardType.Shuffle, id: i, name: "Generic" });
        }
        for (let i: number = 52; i < 56; i++) {
            this._deck.push({ type: CardType.Skip, id: i, name: "Generic" });
        }
    }

    /**
     * When an Exploding Kitten is drawn and defused, this function puts the card back into the draw pile at the location of the player's choice.
     * 
     * @param kitten the Exploding Kitten that was drawn
     * @param index the spot in the deck to replace it
     */
    public replaceExplodingKitten(kitten: Card, index: number) {
        // Insert Kitten into deck
    }

    /**
     * This function shows the top numCards cards to the player.
     * 
     * @param numCards the number of cards to show
     * @returns the array of cards to show
     */
    public seeFuture(numCards: number): Card[] {
        return this.deck.slice(0, numCards);
    }

    /**
     * This function shuffles the deck of cards.
     */
    public shuffleDeck() {
        // Shuffle the deck
    }

    /**
     * Gets the DrawDeck object's deck.
     * 
     * @return the DrawDeck object's deck
     */
    public get deck(): Card[] {
        return this._deck;
    }

    /**
     * Sets the DrawDeck object's deck.
     * 
     * @param value the edited DrawDeck object's deck
     */
    public set deck(value: Card[]) {
        this._deck = value;
    }
}