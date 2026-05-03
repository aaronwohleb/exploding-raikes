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

    // Holds drawn Exploding Kauffman while the player picks where to reinsert it via the defuse slider
    private _pendingDefuseKauffman: Card | null;

    public constructor(name: string, playerNum: number, userId: string) {
        this._name = name;
        this._playerNum = playerNum;
        this._userId = userId;
        this._hand = [];
        this._selectedCards = [];
        this._hasNope = false;
        this._pendingDefuseKauffman = null;
    }

    /**
     * This function draws a card from the DrawDeck and adds it to this player's hand. Handles Exploding Kauffman draws as well.
     * 
     * @param game the game state before the draw
     */
    public drawCard(game: Game): {drawnCard: Card; exploded: boolean; defusePending?: boolean} {

        if (game.activePlayer !== this) {
            throw new Error("It is not your turn");
        }

        let drawnCard: Card = game.drawDeck.deck.shift()!;
        let exploded = false;

        if (drawnCard.type == CardType.Exploding_Kauffman) {
            let defuseIndex = this.hand.findIndex(c => c.type === CardType.Defuse);

            if (defuseIndex !== -1) {
                let defuse: Card = this.hand.splice(defuseIndex, 1)[0];
                game.discardPile.pile.push(defuse);

                this.pendingDefuseKauffman = drawnCard; // Store the drawn kitten while waiting for slider input
                
                return {drawnCard, exploded: false, defusePending: true};
            } else {
                this.lose(game);
                exploded = true;
                return { drawnCard, exploded };
            }

        } else {
            if (drawnCard.type == CardType.Nope) {
                this.hasNope = true;
            }
            this.hand.push(drawnCard);
        }

        // Progress turns
        game.numTurns--;
        if (game.numTurns <= 0) {
            this.endTurn(game);
        }

        return {drawnCard, exploded};
    }

    /**
     * Called by the socket once the user selects a slider position.
     */
    public resolveDefuse(game: Game, insertIndex: number) {
        if (game.activePlayer !== this) throw new Error("It is not your turn!");
        
        if (!this.pendingDefuseKauffman) {
            throw new Error("No Exploding Kauffman is currently pending defusal!");
        }

        // Put the original kitten back into the deck
        game.drawDeck.replaceExplodingKauffman(this.pendingDefuseKauffman, insertIndex);

        // Clear the pending kitten so it can't be reused
        this.pendingDefuseKauffman = null;

        // progress turn
        game.numTurns--;
        if (game.numTurns <= 0) {
            this.endTurn(game);
        }
    }

    /**
     * Determines if the SelectedCards are legal to play. Particularly useful for multi-card plays, but will also stop plays like 1 Bathroom_Drain_Bug.
     * 
     * @returns true if legal, false if not
     */
    public checkMove(): boolean {
        switch (this.selectedCards.length) {
            case 1:
                const illegalSingles: CardType[] = [
                    CardType.Bathroom_Drain_Bug,
                    CardType.Mega_Bug,
                    CardType.Legacy_Bug,
                    CardType.Syntax_Bug,
                    CardType.Heisenbug,
                    // Nope is legal to play as a single card, but illegal under normal circumstances
                    CardType.Nope,
                    CardType.Defuse,
                    CardType.Exploding_Kauffman,
                ];

                return !illegalSingles.includes(this.selectedCards[0].type);

            case 2:
                return this.selectedCards[0].type === this.selectedCards[1].type;

            case 3: 
                return this.selectedCards[0].type === this.selectedCards[1].type && this.selectedCards[0].type === this.selectedCards[2].type;

            case 5:
                const typeSet = new Set<CardType>();
                for (let card of this.selectedCards) {
                    typeSet.add(card.type);
                }
                return typeSet.size == 5;
        }
        return false;
    }

    /**
     * Executes the actual effect of a card play after the Nope window has expired.
     * 
     * @param game the game state
     * @param cards the cards to execute the final effect of
     * @returns futureCards: if see the future was played, contains the top three cards of the draw deck
     * @returns cardRequest: if the play requires action from any player, this contains the action type
     * @returns lastPlayedCard: the card to display to the discard pile
     */
    public executeFinalEffect(game: Game, cards: Card[]): {futureCards?: Card[]; cardRequest?: CardRequestType; lastPlayedCard?: Card} {
        
        // 5-card combo: player picks a card from the discard pile (post-resolution)
        if (cards.length === 5) {
            return { cardRequest: CardRequestType.Five_Card_Combo, lastPlayedCard: cards[0] };
        }

        // Single card logic 
        const card = cards[0];
        switch (card.type) {
            case CardType.Attack:
                // Attacks stack by adding 2: playing an Attack ends your turn immediately
                const currentTurns = game.numTurns;
                this.endTurn(game);          // endTurn resets numTurns to 1, so we overwrite after
                game.numTurns = currentTurns > 1 ? currentTurns + 2 : 2;
                break;
 
            case CardType.Favor:
                return { cardRequest: CardRequestType.Favor, lastPlayedCard: card };

            case CardType.Nope:
                // Logically shouldn't reach here as executeFinalEffect is for the action being noped
                break;

            case CardType.See_the_Future:
                let returnCards: Card[] = game.drawDeck.seeFuture(3);
                return {futureCards: returnCards, lastPlayedCard: card};

            case CardType.Shuffle:
                game.drawDeck.shuffleDeck();
                break;

            case CardType.Skip:
                game.numTurns--;
                if (game.numTurns <= 0) {
                    this.endTurn(game);
                }
                break;
        }

        return { lastPlayedCard: card };
    }

    // --- RESOLUTION FUNCTIONS FOR FRONTEND QUERIES ---

    /**
     * Resolves a Favor: Target player actively chose a card to give to this player.
     */
    public resolveFavor(target: Player, givenCardId: number): Card {
        const stolenCard = target.removeCardFromHand(givenCardId);
        this.hand.push(stolenCard);
        return stolenCard;
    }

    /**
     * Resolves a Two Card Combo: This player steals a random card from the target.
     */
    public resolveTwoCardCombo(target: Player): Card {
        if (target.hand.length === 0) throw new Error("Target player has no cards.");
        
        const randomIndex = Math.floor(Math.random() * target.hand.length);
        const stolenCard = target.hand.splice(randomIndex, 1)[0];
        
        this.hand.push(stolenCard);
        return stolenCard;
    }

    /**
     * Resolves a Three Card Combo: This player asks the target for a specific card type.
     */
    public resolveThreeCardCombo(target: Player, requestedType: CardType): Card | null {
        const targetCardIndex = target.hand.findIndex(c => c.type === requestedType);
        
        if (targetCardIndex !== -1) {
            const stolenCard = target.hand.splice(targetCardIndex, 1)[0];
            this.hand.push(stolenCard);
            return stolenCard;
        }
        
        // Return null if the target didn't have the card
        return null; 
    }

    /**
     * Resolves a Five Card Combo: This player picks a card type from the discard pile,
     * and receives the first card of that type found.
     */
    public resolveFiveCardCombo(game: Game, requestedType: CardType): Card {
        const cardIndex = game.discardPile.pile.findIndex(c => c.type === requestedType);
        if (cardIndex === -1) {
            throw new Error(`No ${requestedType} card found in the discard pile.`);
        }
        const chosenCard = game.discardPile.pile.splice(cardIndex, 1)[0];
        this.hand.push(chosenCard);
        return chosenCard;
    }
    
    /**
     * Controls a player's hand and the game's playerList after a player explodes.
     * 
     * @param game the game state
     */
    public lose(game: Game) {
        // Add all of the player's cards to the discard pile 
        game.discardPile.pile.unshift(...this.hand);
        // Remove the player from the playerList and end their turn
        this.endTurn(game);
        game.playerList = game.playerList.filter(player => player !== this);
    }

    /**
     * Helper function to remove a players card by id and return it, used for resolving favors and combos.
     * 
     * @param cardId card Id to remove from hand
     * @returns removed card
     */
    private removeCardFromHand(cardId: number): Card {
        const index = this.hand.findIndex(c => c.id === cardId);
        if (index === -1) throw new Error("Card not found in hand.");
        return this.hand.splice(index, 1)[0];
    }

    /**
     * Ends the player's turn and progresses to the next player. 
     * 
     * @param game 
     */
    private endTurn(game: Game) {
        let currentIndex = game.playerList.indexOf(game.activePlayer);
        let nextIndex = (currentIndex + 1) % game.playerList.length;
        game.activePlayer = game.playerList[nextIndex];

        game.numTurns = 1;
    }

    public get name(): string { return this._name; }
    public get playerNum(): number { return this._playerNum; }
    public get userId(): string { return this._userId; }

    public get hand(): Card[] { return this._hand; }
    public set hand(value: Card[]) { this._hand = value; }

    public get selectedCards(): Card[] { return this._selectedCards; }
    public set selectedCards(value: Card[]) { this._selectedCards = value; }

    public get hasNope(): boolean { return this._hasNope; }
    public set hasNope(value: boolean) { this._hasNope = value; }

    public get pendingDefuseKauffman(): Card | null { return this._pendingDefuseKauffman; }
    public set pendingDefuseKauffman(value: Card | null) { this._pendingDefuseKauffman = value; }
}