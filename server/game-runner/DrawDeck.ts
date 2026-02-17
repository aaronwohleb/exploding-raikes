/**
 * Represents a deck of Exploding Kittens cards with the functionality of the game's draw pile.
 */
class DrawDeck {

    private _deck: Card[];

    /**
     * Builds a full deck of Exploding Kittens Cards.
     */
    public constructor() {
        this._deck = [];
        // Make full deck of cards
        for (let i: number = 0; i < 4; i++) {
            this.deck.push(new Card(CardType.Attack, i, "Generic"));
        }
        for (let i: number = 4; i < 8; i++) {
            this.deck.push(new Card(CardType.Beard_Cat, i, "Generic"));
        }
        for (let i: number = 8; i < 12; i++) {
            this.deck.push(new Card(CardType.Catermelon, i, "Generic"));
        }
        for (let i: number = 12; i < 16; i++) {
            this.deck.push(new Card(CardType.Hairy_Potato_Cat, i, "Generic"));
        }
        for (let i: number = 16; i < 20; i++) {
            this.deck.push(new Card(CardType.Rainbow_Ralphing_Cat, i, "Generic"));
        }
        for (let i: number = 20; i < 24; i++) {
            this.deck.push(new Card(CardType.Tacocat, i, "Generic"));
        }
        for (let i: number = 24; i < 30; i++) {
            this.deck.push(new Card(CardType.Defuse, i, "Generic"));
        }
        for (let i: number = 30; i < 34; i++) {
            this.deck.push(new Card(CardType.Exploding_Kitten, i, "Generic"));
        }
        for (let i: number = 34; i < 38; i++) {
            this.deck.push(new Card(CardType.Favor, i, "Generic"));
        }
        for (let i: number = 38; i < 43; i++) {
            this.deck.push(new Card(CardType.Nope, i, "Generic"));
        }
        for (let i: number = 43; i < 48; i++) {
            this.deck.push(new Card(CardType.See_the_Future, i, "Generic"));
        }
        for (let i: number = 48; i < 52; i++) {
            this.deck.push(new Card(CardType.Shuffle, i, "Generic"));
        }
        for (let i: number = 52; i < 56; i++) {
            this.deck.push(new Card(CardType.Skip, i, "Generic"));
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
        return [this.deck[0]];
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