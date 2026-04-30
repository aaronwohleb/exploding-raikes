import { Card, CardType } from '../types/types';
import { Game } from './Game';
/**
 * Represents a deck of Exploding Kauffman cards with the functionality of the game's draw pile.
 */
export class DrawDeck {

    private _deck: Card[];

    private readonly HandSize: number = 7;
    /**
     * Builds a full deck of Exploding Kauffman Cards.
     */
    public constructor(game: Game) {
        this._deck = [];
        // Make full deck of cards (Hard coded and subject to change)
        const cardConfigs = [
            { type: CardType.Attack, count: 4 },
            { type: CardType.Bathroom_Drain_Bug, count: 4 },
            { type: CardType.Mega_Bug, count: 4 },
            { type: CardType.Legacy_Bug, count: 4 },
            { type: CardType.Syntax_Bug, count: 4 },
            { type: CardType.Heisenbug, count: 4 },
            { type: CardType.Favor, count: 4 },
            { type: CardType.Nope, count: 5 },
            { type: CardType.See_the_Future, count: 5 },
            { type: CardType.Shuffle, count: 4 },
            { type: CardType.Skip, count: 4 },
        ];

        let currentId = 0;
        for (const config of cardConfigs) {
            for (let i = 0; i < config.count; i++) {
                this.deck.push({
                    type: config.type,
                    id: currentId++,
                    name: "Generic"
                });
            }
        }

        // Shuffle the deck before dealing cards to ensure randomness in starting hands
        this.shuffleDeck();

        this.dealCards(game, currentId);
        currentId = currentId + game.playerList.length;

        const extraConfigs = [
            { type: CardType.Defuse, count: 8 - game.playerList.length },
            { type: CardType.Exploding_Kauffman, count: 4 }
        ];

        for (const config of extraConfigs) {
            for (let i = 0; i < config.count; i++) {
                this.deck.push({
                    type: config.type,
                    id: currentId++,
                    name: "Generic"
                });
            }
        }

        this.shuffleDeck();
    
    }

    /**
     * Helper function to deal a starting hand to each player. A starting hand should have 7 non-defuse, non-exploding kauffman cards, and 1 defuse.
     */
    public dealCards(game: Game, currId: number) {
        for (let i = 0; i < this.HandSize; i++) {
            for (let player of game.playerList) {
                //TODO: add undefined checking for shift
                player.hand.push(this._deck.shift()!)
            }
        }
        for (let player of game.playerList) {
            player.hand.push({
                id: currId++,
                type: CardType.Defuse,
                name: "Generic"
            })
        }
    }


    /**
     * When an Exploding Kauffman is drawn and defused, this function puts the card back into the draw pile at the location of the player's choice.
     *
     * @param kitten the Exploding Kauffman that was drawn
     * @param index the spot in the deck to replace it
     */
    public replaceExplodingKauffman(kitten: Card, index: number) {
        try {
            this.deck.splice(index, 0, kitten);
        } catch (error) {
            // If invalid deck position, assign to nearest available position
            if (index < 0) {
                this.deck.unshift(kitten);
            } else {
                this.deck.push(kitten);
            }
        }
        
    }

    /**
     * This function shows the top numCards cards to the player.
     * 
     * @param numCards the number of cards to show
     * @returns the array of cards to show
     */
    public seeFuture(numCards: number): Card[] {
        if (numCards > this.deck.length) {
            return this.deck.slice(0, this.deck.length);
        }
        return this.deck.slice(0, numCards);
    }

    /**
     * This function shuffles the deck of cards.
     */
    public shuffleDeck() {
        let currentIndex: number = this.deck.length;
        let randIndex: number = -1;

        while (currentIndex !== 0) {
            // Pick a random remaining element.
            randIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            // Swap it with the current element
            [this.deck[currentIndex], this.deck[randIndex]] = [this.deck[randIndex], this.deck[currentIndex]];
        }
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