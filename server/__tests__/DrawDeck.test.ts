import { DrawDeck } from "../src/game-runner/DrawDeck";
import { Game } from "../src/game-runner/Game";
import { Player } from "../src/game-runner/Player";
import { Card, CardType } from "../src/types/types";

function makeGame(numPlayers: number = 2): Game {
  const players = Array.from(
    { length: numPlayers },
    (_, i) => new Player(`Player${i}`, i, `uid${i}`),
  );
  return new Game(players);
}

function makeCard(type: CardType, id: number): Card {
  return { type, id, name: "Generic" };
}

describe("DrawDeck", () => {
  test("constructor: each player receives 8 cards (7 normal + 1 defuse)", () => {
    const game = makeGame(2);
    for (const player of game.playerList) {
      expect(player.hand.length).toBe(8);
    }
  });

  test("constructor: each player hand contains exactly one Defuse", () => {
    const game = makeGame(2);
    for (const player of game.playerList) {
      const defuses = player.hand.filter((c) => c.type === CardType.Defuse);
      expect(defuses.length).toBe(1);
    }
  });

  test("constructor: deck contains correct number of Exploding Kittens (4)", () => {
    const game = makeGame(2);
    const kittens = game.drawDeck.deck.filter(
      (c) => c.type === CardType.Exploding_Kitten,
    );
    expect(kittens.length).toBe(4);
  });

  test("seeFuture: returns up to numCards from top of deck", () => {
    const game = makeGame(2);
    const top3 = game.drawDeck.seeFuture(3);
    expect(top3.length).toBe(3);
  });

  test("seeFuture: returns entire deck if numCards exceeds deck size", () => {
    const game = makeGame(2);
    const deckSize = game.drawDeck.deck.length;
    const result = game.drawDeck.seeFuture(deckSize + 100);
    expect(result.length).toBe(deckSize);
  });

  test("seeFuture: does not remove cards from deck", () => {
    const game = makeGame(2);
    const before = game.drawDeck.deck.length;
    game.drawDeck.seeFuture(3);
    expect(game.drawDeck.deck.length).toBe(before);
  });

  test("replaceExplodingKitten: inserts kitten at specified index", () => {
    const game = makeGame(2);
    const kitten = makeCard(CardType.Exploding_Kitten, 999);
    game.drawDeck.deck = [
      makeCard(CardType.Skip, 1),
      makeCard(CardType.Skip, 2),
    ];
    game.drawDeck.replaceExplodingKitten(kitten, 1);
    expect(game.drawDeck.deck[1].id).toBe(999);
  });

  test("replaceExplodingKitten: negative index puts kitten at front", () => {
    const game = makeGame(2);
    const kitten = makeCard(CardType.Exploding_Kitten, 998);
    game.drawDeck.deck = [makeCard(CardType.Skip, 1)];
    game.drawDeck.replaceExplodingKitten(kitten, -5);
    expect(game.drawDeck.deck[0].id).toBe(998);
  });

  test("shuffleDeck: deck length stays the same after shuffle", () => {
    const game = makeGame(2);
    const before = game.drawDeck.deck.length;
    game.drawDeck.shuffleDeck();
    expect(game.drawDeck.deck.length).toBe(before);
  });
});
