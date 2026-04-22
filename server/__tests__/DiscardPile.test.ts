import { DiscardPile } from "../src/game-runner/DiscardPile";
import { Player } from "../src/game-runner/Player";
import { Card, CardType } from "../src/types/types";

function makeCard(type: CardType, id: number): Card {
  return { type, id, name: "Generic" };
}

function makePlayer(): Player {
  return new Player("TestPlayer", 0, "uid0");
}

describe("DiscardPile", () => {
  test("constructor: pile starts empty", () => {
    const pile = new DiscardPile();
    expect(pile.pile.length).toBe(0);
  });

  test("topCard: returns null when pile is empty", () => {
    const pile = new DiscardPile();
    expect(pile.topCard).toBeNull();
  });

  test("topCard: returns the last added card", () => {
    const pile = new DiscardPile();
    pile.pile.push(makeCard(CardType.Skip, 1));
    pile.pile.push(makeCard(CardType.Attack, 2));
    expect(pile.topCard?.id).toBe(2);
  });

  test("addCards: adds multiple cards to pile", () => {
    const pile = new DiscardPile();
    pile.addCards([makeCard(CardType.Skip, 1), makeCard(CardType.Attack, 2)]);
    expect(pile.pile.length).toBe(2);
  });

  test("drawFromDiscard: removes card from pile at given index", () => {
    const pile = new DiscardPile();
    pile.addCards([makeCard(CardType.Skip, 1), makeCard(CardType.Attack, 2)]);
    const player = makePlayer();
    pile.drawFromDiscard(player, 0);
    expect(pile.pile.length).toBe(1);
    expect(pile.pile[0].id).toBe(2);
  });

  test("drawFromDiscard: adds drawn card to player hand", () => {
    const pile = new DiscardPile();
    pile.addCards([makeCard(CardType.Favor, 10)]);
    const player = makePlayer();
    pile.drawFromDiscard(player, 0);
    expect(player.hand.some((c) => c.id === 10)).toBe(true);
  });

  test("set pile: replaces pile with new array", () => {
    const pile = new DiscardPile();
    pile.pile = [makeCard(CardType.Nope, 99)];
    expect(pile.pile.length).toBe(1);
    expect(pile.pile[0].id).toBe(99);
  });
});
