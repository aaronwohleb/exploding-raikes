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
        
        if (!this.pendingDefuseKitten) {
            throw new Error("No Exploding Kitten is currently pending defusal!");
        }

        // Put the original kitten back into the deck
        game.drawDeck.replaceExplodingKitten(this.pendingDefuseKitten, insertIndex);

        // Clear the pending kitten so it can't be reused
        this.pendingDefuseKitten = null;

        // progress turn
        game.numTurns--;
        if (game.numTurns <= 0) {
            this.endTurn(game);
        }
    }

    /**
     * Determines if the SelectedCards are legal to play. Particularly useful for multi-card plays, but will also stop plays like 1 Beard_Cat.
     * 
     * @returns true if legal, false if not
     */
    public checkMove(): boolean {
        switch (this.selectedCards.length) {
            case 1:
                const illegalSingles: CardType[] = [
                    CardType.Beard_Cat,
                    CardType.Catermelon,
                    CardType.Hairy_Potato_Cat,
                    CardType.Rainbow_Ralphing_Cat,
                    CardType.Tacocat,
                    CardType.Defuse,
                    CardType.Exploding_Kitten,
                ];

                return illegalSingles.includes(this.selectedCards[0].type);

            case 2:
                return this.selectedCards[0].type === this.selectedCards[1].type;

            case 3: 
                return this.selectedCards[0].type === this.selectedCards[1].type && this.selectedCards[0].type === this.selectedCards[2].type;

            case 5:
                const typeMap = new Map<CardType, number>();
                for (let card of this.selectedCards) {
                    typeMap.set(card.type, 0);
                }
                return typeMap.size == 5;
        }
        return false;
    }

    /**
     * Handles logic for multi-card combos. Designed to hand off card functionality to playCard() for single-card plays.
     * 
     * @param game the game state
     * @returns an array of cards for STF, or the type of request needed to send to the frontend for plays like Favor or Combos and 
     * the last played card for frontend display purposes, if applicable
     */
    public playSelectedCards(game: Game, cardIds: number[]): {futureCards?: Card[]; cardRequest?: CardRequestType; lastPlayedCard?: Card} {
        if (game.activePlayer !== this) {
            throw new Error("It is not your turn!");
        }
        const cardsToPlay = this.hand.filter(c => cardIds.includes(c.id));

        if (cardsToPlay.length !== cardIds.length) {
            console.error("One or more selected cards were not found in the player's hand.");
            return { };
        }

        switch (cardsToPlay.length) {
            case 1:
                return this.playCard(cardsToPlay[0], game);

            case 2:
                // Two Card Combo
                if (cardsToPlay[0].type === cardsToPlay[1].type) {
                this.discardCards(cardsToPlay, game);
                return { cardRequest: CardRequestType.Two_Card_Combo, lastPlayedCard: cardsToPlay[0] };
            }

            case 3: 
                if (cardsToPlay[0].type === cardsToPlay[1].type && cardsToPlay[0].type === cardsToPlay[2].type) {
                this.discardCards(cardsToPlay, game);
                return { cardRequest: CardRequestType.Three_Card_Combo, lastPlayedCard: cardsToPlay[0] };
            }
            case 5:
                //TODO: Do five-card combo (Later)
                for (let card of this.selectedCards) {
                    this.hand = this.hand.filter(currCard => currCard !== card);
                    game.discardPile.pile.unshift(card);
                }
                // Discard draw
                return {};
                
        }
        console.error("This card play was invalid. (Not 1, 2, 3, 5 cards)");
        return {};
    }

    /**
     * This function applies the Card's effects to the game.
     * 
     * @param card the card being played
     * @param game the game being played on which to apply the Card's effects
     * @returns an array of cards for STF, or the type of request needed to send to the frontend for plays like Favor or Combos and 
     * the last played card for frontend display purposes, if applicable
     */
    public playCard(card: Card, game: Game): {futureCards?: Card[]; cardRequest?: CardRequestType; lastPlayedCard?: Card} {

        const illegalSingles: CardType[] = [
            CardType.Beard_Cat, CardType.Catermelon, CardType.Hairy_Potato_Cat,
            CardType.Rainbow_Ralphing_Cat, CardType.Tacocat, CardType.Defuse, CardType.Exploding_Kitten
        ];

        if (illegalSingles.includes(card.type)) {
            console.warn(`You cannot play ${card.type} alone`);
            return { };
        }

        // Handle card effects and discard card
        this.discardCards([card], game);

        switch (card.type) {
            case CardType.Attack: 
                // NOTE: game.numTurns MUST be 0 before a player's chance to play/draw ends
                if (game.numTurns > 1) {
                    const storedAttacks = game.numTurns - 1;
                    this.endTurn(game);
                    game.numTurns = 2 + storedAttacks; // Set next player turns to attack + any stored attacks
                    console.log(`${game.activePlayer} just attacked, but they still have more turns. Successfully stored attack info`);
                } else {
                    this.endTurn(game);
                    game.numTurns = 2 
                }
                break;  

            case CardType.Favor:
                return { cardRequest: CardRequestType.Favor, lastPlayedCard: card };
                
            case CardType.Nope:
                //TODO: Implement before R2

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
        // Return the valid card play for frontend to display, even if there is no additional info to send
        return {lastPlayedCard: card};
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

    public get pendingDefuseKitten(): Card | null {
        return this._pendingDefuseKitten;
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

    public set pendingDefuseKitten(value: Card | null) {
        this._pendingDefuseKitten = value;
    }
}