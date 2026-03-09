import { Card, CardType } from '../types/types';
import { Game } from './Game';
export class Player {

    private readonly _name: string;
    private readonly _playerNum: number;

    private _hand: Card[];
    private _selectedCards: Card[];
    
    /**
     * Constructs a new Player object with a given name and number - also intializes empty hand and selcted cards arrays.
     * 
     * @param name the player's name
     * @param playerNum the player's numbner in play order
     */
    public constructor(name: string, playerNum: number) {
        this._name = name;
        this._playerNum = playerNum;
        this._hand = [];
        this._selectedCards = [];
    }

    /**
     * Controls the flow of a player's turn. This function allows a player to play as many cards as they'd like before ending the turn with a card draw.
     * 
     * @param game the game state before the turn
     */
    public takeTurn(game: Game) {
        // Take turn
    }

    /**
     * This function draws a card from the DrawDeck and adds it to this player's hand. Handles Exploding Kitten draws as well.
     * 
     * @param game the game state before the draw
     */
    public drawCard(game: Game): Card|undefined {
        // Draw a card
        return undefined;
    }

    /**
     * 
     * @param game the game state
     * @param cards the cards the player wants to play
     * @param target option target player for cards like Targeted Attack or Favor
     */
    public playCards(game: Game, cardIds: number[], target?: Player): {stolenCard?: Card; futureCards?: Card[]} {
        return { stolenCard: undefined, futureCards: undefined };
    }

    /**
     * Determines if the SelectedCards are legal to play. Particularly useful for multi-card plays, but will also stop plays like 1 Beard_Cat.
     * 
     * @returns true if legal, false if not
     */
    public checkMove(): boolean {
        // Check if legal
        return true;
    }

    /**
     * Removes the player from the game and subsitutes them with a computer player, which receives their hand.
     */
    public leaveGame() {
        // Leave the fame
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



}