class DrawDeck {

    private deck: Card[];

    public constructor() {
        this.deck = [];
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

    public replaceExplodingKitten(kitten: Card, index: number) {
        // Insert Kitten into deck
    }

    public seeFuture(numCards: number): Card[] {
        return [this.deck[0]];
    }

    public shuffleDeck() {
        // Shuffle the deck
    }
}