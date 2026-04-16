import { Card, CardType, CardRequestType } from '../types/types';
import { Game } from './Game';

/**
 * This class represents a player and their actions.
 */
export class Player {

    private readonly _name: string;
    private readonly _playerNum: number;
    private readonly _userId: string;

    private _hand: Card[];
    private _selectedCards: Card[];
    private _hasNope: boolean;

    // Temporarily holds exploding kitten so cardId is preserved while waiting for slider input on where to insert it back into the deck
    private _pendingDefuseKitten: Card | null;
    
    /**
     * Constructs a new Player object with a given name and number - also intializes empty hand and selcted cards arrays.
     * 
     * @param name the player's name
     * @param playerNum the player's numbner in play order
     * @param userId the player's user ID
     */
    public constructor(name: string, playerNum: number, userId: string) {
        this._name = name;
        this._playerNum = playerNum;
        this._userId = userId;
        this._hand = [];
        this._selectedCards = [];
        this._hasNope = false;
        this._pendingDefuseKitten = null;
    }

    /**
     * This function draws a card from the DrawDeck and adds it to this player's hand. Handles Exploding Kitten draws as well.
     * 
     * @param game the game state before the draw
     */
    public drawCard(game: Game): {drawnCard: Card; exploded: boolean; defusePending?: boolean} {
        //TODO: Determine if async or if using websockets
        //NOTE: Cannot return Card if async
        //TODO: Add undefined checking for shift

        if (game.activePlayer !== this) {
            throw new Error("It is not your turn");
        }

        let drawnCard: Card = game.drawDeck.deck.shift()!;
        let exploded = false;

        console.log(`${this.name} drew a ${drawnCard.type.toString()} card`);

        if (drawnCard.type == CardType.Exploding_Kitten) {
            let defuseIndex = this.hand.findIndex(c => c.type === CardType.Defuse);

            if (defuseIndex !== -1) {
                let defuse: Card = this.hand.splice(defuseIndex, 1)[0];
                game.discardPile.pile.push(defuse);
                this.pendingDefuseKitten = drawnCard; // Store the drawn kitten while waiting for slider input
                return {drawnCard, exploded: false, defusePending: true};
            } else {
                this.lose(game);
                exploded = true;
            }
        } else {
            if (drawnCard.type == CardType.Nope) {
                this.hasNope = true;
            }
            this.hand.push(drawnCard);
        }

        return {drawnCard, exploded};
    }

    /**
     * This function checks to see if the move the player is trying to make is valid. 
     * 
     * @return true if it is an invalid move, false otherwise
     */
    public checkMove(): boolean {

        let illegalSingles = [CardType.Beard_Cat, CardType.Catermelon, CardType.Hairy_Potato_Cat, CardType.Rainbow_Ralphing_Cat, CardType.Tacocat, CardType.Defuse];

        if (this.selectedCards.length === 1) {
            return illegalSingles.includes(this.selectedCards[0].type);
        } else if (this.selectedCards.length === 2) {
            return this.selectedCards[0].type !== this.selectedCards[1].type;
        } else if (this.selectedCards.length === 3) {
            return this.selectedCards[0].type !== this.selectedCards[1].type || this.selectedCards[0].type !== this.selectedCards[2].type || this.selectedCards[1].type !== this.selectedCards[2].type;
        }

        return true;
    }

    /**
     * Executes the final effect of the cards after the Nope timer has expired.
     * 
     * @param cards the cards whose effect is being triggered
     * @param game the current game state
     * @returns an object containing optional follow-up data (future cards or request types)
     */
    public executeFinalEffect(cards: Card[], game: Game): { futureCards?: Card[], cardRequest?: CardRequestType } {
        const type = cards[0].type;

        if (cards.length === 1) {
            switch (type) {
                case CardType.Attack:
                    game.numTurns += 2;
                    // Logic to pass turn would be handled in the caller
                    return {};
                case CardType.See_the_Future:
                    return { futureCards: game.drawDeck.seeFuture(3) };
                case CardType.Shuffle:
                    game.drawDeck.shuffleDeck();
                    return {};
                case CardType.Skip:
                    game.numTurns--;
                    return {};
                case CardType.Favor:
                    return { cardRequest: CardRequestType.Favor };
            }
        } else if (cards.length === 2) {
            return { cardRequest: CardRequestType.Two_Card_Combo };
        } else if (cards.length === 3) {
            return { cardRequest: CardRequestType.Three_Card_Combo };
        }

        return {};
    }

    /**
     * This function is called when a player draws an exploding kitten and does not have a defuse card.
     * 
     * @param game the game state after the loss
     */
    public lose(game: Game) {
        game.discardPile.addCards(this.hand);
        this.hand = [];
        game.playerList.splice(game.playerList.indexOf(this), 1);
        console.log(`${this.name} has exploded and is out of the game!`);
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
     * Gets the Player's user id.
     * 
     * @return the Player's user id
     */
    public get userId(): string {
        return this._userId;
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

    public get pendingDefuseKitten(): Card | null {
        return this._pendingDefuseKitten;
    }
    
    public set pendingDefuseKitten(value: Card | null) {
        this._pendingDefuseKitten = value;
    }

}