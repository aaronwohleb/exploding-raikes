import { Player } from './Player';
import { DrawDeck } from './DrawDeck';
import { DiscardPile } from './DiscardPile';
import { Card, CardType, CardRequestType, pendingAction, CardPlaySetupResult, PendingActionResult } from '../types/types';

/**
 * Responsible for holding the game state and running the game.
 */
export class Game {

    private _playerList: Player[];
    private _drawDeck: DrawDeck;
    private _discardPile: DiscardPile;
    private _activePlayer: Player;
    private _numTurns: number;

    public pendingAction: pendingAction | null = null;
    public nopeStack: Card[] = [];
    public nopeTimer: NodeJS.Timeout | null = null;

    /**
     * Resets the game state after a Nope window closes or an action is resolved.
     */
    public clearPendingAction() {
        if (this.nopeTimer) clearTimeout(this.nopeTimer);
        this.pendingAction = null;
        this.nopeStack = [];
        this.nopeTimer = null;
    }

     /**
     * Determines whether a set of cards requires a target player before the Nope window can begin.
     * 
     * @param cards the cards being played
     * @returns the CardRequestType if a target is needed, null otherwise
     */
    public static getRequiredTarget(cards: Card[]): CardRequestType | null {
        if (cards.length === 2) return CardRequestType.Two_Card_Combo;
        if (cards.length === 3) return CardRequestType.Three_Card_Combo;
        if (cards.length === 1 && cards[0].type === CardType.Favor) return CardRequestType.Favor;
        return null;
    }

    /**
     * Removes the played cards from the player's hand and sets up the pending action.
     * Returns whether the play requires a target before the Nope window can start.
     * 
     * cases:
     *  - If requiresTarget is FALSE, socket layer announces the play and starts the Nope timer immediately.
     *  - If requiresTarget is TRUE, socket layer asks the player to pick a target. 
     *    The play is not announced until setTarget() is called.
     * 
     * @param player the player who is playing cards
     * @param cards  the cards being played (already validated by checkMove)
     * @returns a CardPlaySetupResult indicating next steps for the socket layer
     */
    public beginCardPlay(player: Player, cards: Card[]): CardPlaySetupResult {
        const cardIds = cards.map(c => c.id);
        player.hand = player.hand.filter(c => !cardIds.includes(c.id));
 
        this.pendingAction = { playerId: player.userId, cards };
 
        const targetType = Game.getRequiredTarget(cards);
        if (targetType) {
            this.pendingAction.actionType = targetType;
            return { requiresTarget: true, cardRequest: targetType };
        }
 
        return { requiresTarget: false };
    }

    /**
     * Stores the target information on the pending action.
     * Called by the socket layer after the player has selected a target.
     * After this call, the socket layer should announce the play to the room and start the Nope timer.
     * 
     * @param targetUserId     the userId of the targeted player
     * @param requestedCardType only used for 3-card combos — the specific card type being requested
     */
    public setTarget(targetUserId: string, requestedCardType?: CardType) {
        if (!this.pendingAction) throw new Error("No pending action to set a target on.");
        this.pendingAction.targetUserId = targetUserId;
        if (requestedCardType) {
            this.pendingAction.requestedCardType = requestedCardType;
        }
    }

    /**
     * Processes a Nope card being played during the Nope window.
     * Removes the Nope from the player's hand and pushes it onto the nope stack.
     * 
     * @param player   the player playing the Nope
     * @param nopeCard the Nope card being played
     */
    public playNope(player: Player, nopeCard: Card) {
        player.hand = player.hand.filter(c => c.id !== nopeCard.id);
        this.nopeStack.push(nopeCard);
    }

    /**
     * Resolves the pending action after the Nope window has expired.
     * 
     * Checks the nope stack count, executes the card effect (or discards if noped),
     * moves all played cards and Nopes to the discard pile, and clears the pending state.
     * 
     * For targeted plays (Favor, 2-card, 3-card combo), the target is already stored
     * on the pendingAction from the earlier setTarget() call.
     * 
     * @returns a PendingActionResult the socket layer uses to decide what to emit
     */
    public resolvePendingAction(): PendingActionResult | null {
        if (!this.pendingAction) return null;
 
        const sourcePlayer = this._playerList.find(p => p.userId === this.pendingAction!.playerId);
        if (!sourcePlayer) return null;
 
        const sourcePlayerId = this.pendingAction.playerId;
        let result: PendingActionResult;
 
        // Even nope count = original action goes through, odd = noped
        if (this.nopeStack.length % 2 === 0) {
 
            // Discard the played cards and all Nopes
            this._discardPile.addCards(this.pendingAction.cards);
            this._discardPile.addCards(this.nopeStack);
 
            // --- TARGETED PLAYS (target is already set on pendingAction) ---
            if (this.pendingAction.targetUserId) {
                const targetPlayer = this._playerList.find(p => p.userId === this.pendingAction!.targetUserId);
 
                if (!targetPlayer) {
                    // Target disconnected — action stops
                    result = { noped: false, sourcePlayerId };
                    this.clearPendingAction();
                    return result;
                }
 
                result = this.resolveTargetedEffect(sourcePlayer, targetPlayer);
            
            // --- NON-TARGETED PLAYS ---
            } else {
                const effectResult = sourcePlayer.executeFinalEffect(this, this.pendingAction.cards);
 
                result = {
                    noped: false,
                    sourcePlayerId,
                    futureCards: effectResult.futureCards,
                    cardRequest: effectResult.cardRequest,
                };

                if (effectResult.cardRequest === CardRequestType.Five_Card_Combo) {
                    const typeSet = new Set<CardType>();
                    for (const card of this._discardPile.pile) {
                        typeSet.add(card.type);
                    }
                    result.availableDiscardTypes = Array.from(typeSet);
                }
            }
 
        } else {
            // Noped — discard everything, no effect
            this._discardPile.addCards(this.pendingAction.cards);
            this._discardPile.addCards(this.nopeStack);
 
            result = { noped: true, sourcePlayerId };
        }
 
        this.clearPendingAction();
        return result;
    }

    /**
     * Resolves a targeted effect after the Nope window. Called internally by resolvePendingAction().
     * The steal / exchange logic is delegated to the Player resolution methods.
     * 
     * @param sourcePlayer the player who played the cards
     * @param targetPlayer the player being targeted
     * @returns a PendingActionResult with the targeted resolution details
     */
    private resolveTargetedEffect(sourcePlayer: Player, targetPlayer: Player): PendingActionResult {
        const sourcePlayerId = sourcePlayer.userId;
        const actionType = this.pendingAction!.actionType;
 
        switch (actionType) {
            case CardRequestType.Favor:
                // Favor needs a second round of input — the target chooses a card to give.
                // We return info so the socket layer can prompt the target.
                return {
                    noped: false,
                    sourcePlayerId,
                    pendingFavor: {
                        targetUserId: targetPlayer.userId,
                        sourceUserId: sourcePlayer.userId,
                        sourcePlayerName: sourcePlayer.name,
                    },
                };
 
            case CardRequestType.Two_Card_Combo: {
                const stolenCard = sourcePlayer.resolveTwoCardCombo(targetPlayer);
                return {
                    noped: false,
                    sourcePlayerId,
                    comboResult: {
                        sourcePlayerId,
                        targetUserId: targetPlayer.userId,
                        stolenCard,
                    },
                };
            }
 
            case CardRequestType.Three_Card_Combo: {
                const requestedType = this.pendingAction!.requestedCardType!;
                const stolenCard = sourcePlayer.resolveThreeCardCombo(targetPlayer, requestedType);
                return {
                    noped: false,
                    sourcePlayerId,
                    comboResult: {
                        sourcePlayerId,
                        targetUserId: targetPlayer.userId,
                        stolenCard,
                        requestedType,
                    },
                };
            }
 
            default:
                // safety fallback
                console.error(`resolveTargetedEffect: unknown actionType ${actionType}`);
                return { noped: false, sourcePlayerId };
        }
    }

    /**
     * Constructs a new Game object when called containing a player list and a default game state.
     * * @param playerList the list of players playing the game
     */
    public constructor(playerList: Player[]) {
        this._playerList = playerList;
        this._drawDeck = new DrawDeck(this);
        this._discardPile = new DiscardPile();
        this._activePlayer = this.playerList[0];
        this._numTurns = 1;

    }

    /**
     * Gets the game's playerList.
     * * @return the playerList
     */
    public get playerList(): Player[] {
        return this._playerList;
    }

    /**
     * Sets the game's playerlist.
     * * @param value the edited playerList
     */
    public set playerList(value: Player[]) {
        this._playerList = value;
    }

    /**
     * Gets the game's drawDeck.
     * * @return the drawDeck
     */
    public get drawDeck(): DrawDeck {
        return this._drawDeck;
    }

    /**
     * Sets the game's drawDeck.
     * * @param value the edited drawDeck
     */
    public set drawDeck(value: DrawDeck) {
        this._drawDeck = value;
    }

    /**
     * Gets the game's discardPile.
     * * @return the discardPile
     */
    public get discardPile(): DiscardPile {
        return this._discardPile;
    }

    /**
     * Sets the game's playerlist.
     * * @param value the edited discardPile
     */
    public set discardPile(value: DiscardPile) {
        this._discardPile = value;
    }

    /**
     * Gets the game's activePlayer.
     * * @return the activePlayer
     */
    public get activePlayer(): Player {
        return this._activePlayer;
    }

    /**
     * Sets the game's activePlayer.
     * * @param value the edited activePlayer
     */
    public set activePlayer(value: Player) {
        this._activePlayer = value;
    }

    /**
     * Gets the game's turns remaining counter.
     * * @return the numTurns
     */
    public get numTurns(): number {
        return this._numTurns;
    }

    /**
     * Sets the game's turns remaining counter.
     * * @param value the edited numTurns
     */
    public set numTurns(value: number) {
        this._numTurns = value;
    }
}