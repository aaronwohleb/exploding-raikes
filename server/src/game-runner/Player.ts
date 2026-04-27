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

    // Temporarily holds exploding kauffman so cardId is preserved while waiting for slider input on where to insert it back into the deck
    private _pendingDefuseKauffman: Card | null;
    
    /**
     * Constructs a new Player object with a given name and number - also intializes empty hand and selcted cards arrays.
     * * @param name the player's name
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
        this._pendingDefuseKauffman = null;
    }

    /**
     * This function draws a card from the DrawDeck and adds it to this player's hand. Handles Exploding Kauffman draws as well.
     * * @param game the game state before the draw
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
     * * @returns true if legal, false if not
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
                console.log(`${this.name} played an Attack ${game.activePlayer.name} now has ${game.numTurns} turns.`);
                break;
 

            case CardType.Favor:
                return { cardRequest: CardRequestType.Favor, lastPlayedCard: card };

            case CardType.Nope:
                // Logically shouldn't reach here as executeFinalEffect is for the action being noped
                break;

            case CardType.See_the_Future:
                let returnCards: Card[] = game.drawDeck.seeFuture(3);
                console.log(`${game.activePlayer.name} just saw the future (x3)`);
                return {futureCards: returnCards, lastPlayedCard: card};

            case CardType.Shuffle:
                game.drawDeck.shuffleDeck();
                console.log("Shuffled draw deck");
                break;

            case CardType.Skip:
                game.numTurns--;
                if (game.numTurns <= 0) {
                    this.endTurn(game);
                }
                console.log(`${game.activePlayer.name} has skipped a turn`);
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
        console.log(`${this._name} has lost the game and been successfully removed from the playerList.`);
    }

    /**
     * Removes the played cards from the player's hand and adds them to the discard pile.
     * @param cards cards to discard
     * @param game the game state
     */
    private discardCards(cards: Card[], game: Game) {
        const cardIds = cards.map(c => c.id);
        this.hand = this.hand.filter(c => !cardIds.includes(c.id));
        game.discardPile.pile.push(...cards);
    }

    /**
     * Helper function to remove a players card by id and return it, used for resolving favors and combos.
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
     * @param game 
     */
    private endTurn(game: Game) {
        let currentIndex = game.playerList.indexOf(game.activePlayer);
        let nextIndex = (currentIndex + 1) % game.playerList.length;
        game.activePlayer = game.playerList[nextIndex];

        game.numTurns = 1; // Reset turns for the next player
        console.log(`Turn ended. It is now ${game.activePlayer.name}'s turn.`);
    }

    /**
     * Removes the player from the game and subsitutes them with a computer player, which receives their hand.
     */
    public leaveGame() {
        // Leave the game
    }

    /**
     * Adds a player back to the game and replaces the computer opponent, receiving its hand.
     * 
     * NOTE: This function should only be used for a player that has previously disconnected from the game.
     */
    public joinGame() {
        //Join the game
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

    public get pendingDefuseKauffman(): Card | null {
        return this._pendingDefuseKauffman;
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

    public set pendingDefuseKauffman(value: Card | null) {
        this._pendingDefuseKauffman = value;
    }
}