import { DrawDeck } from "../DrawDeck";
import { CardType } from "../../types/types";

describe("DrawDeck", () => {
  describe("constructor", () => {
    it("should have 4 Exploding Kittens", () => {
      const deck = new DrawDeck();
      const kittens = deck.deck.filter(
        (c) => c.type === CardType.Exploding_Kitten,
      );
      expect(kittens.length).toBe(4);
    });

    it("should have 6 Defuse cards", () => {
      const deck = new DrawDeck();
      const defuses = deck.deck.filter((c) => c.type === CardType.Defuse);
      expect(defuses.length).toBe(6);
    });

    it("should assign unique IDs to all cards", () => {
      const deck = new DrawDeck();
      const ids = deck.deck.map((c) => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(deck.deck.length);
    });
  });

  describe("seeFuture", () => {
    it("should return the requested number of cards", () => {
      const deck = new DrawDeck();
      expect(deck.seeFuture(3).length).toBe(3);
    });

    it("should return cards from the top (front) of the deck", () => {
      const deck = new DrawDeck();
      const top3 = deck.seeFuture(3);
      expect(top3).toEqual(deck.deck.slice(0, 3));
    });
  });

  describe("replaceExplodingKitten", () => {
    it("should insert kitten at the given index", () => {
      const deck = new DrawDeck();
      const kitten = {
        type: CardType.Exploding_Kitten,
        id: 999,
        name: "Test Kitten",
      };
      deck.replaceExplodingKitten(kitten, 2);
      expect(deck.deck[2]).toEqual(kitten);
    });

    it("should push to end if index is beyond deck length", () => {
      const deck = new DrawDeck();
      const kitten = {
        type: CardType.Exploding_Kitten,
        id: 999,
        name: "Test Kitten",
      };
      deck.replaceExplodingKitten(kitten, 9999);
      expect(deck.deck[deck.deck.length - 1]).toEqual(kitten);
    });
  });

  describe("shuffleDeck", () => {
    it("should keep the same number of cards after shuffle", () => {
      const deck = new DrawDeck();
      const before = deck.deck.length;
      deck.shuffleDeck();
      expect(deck.deck.length).toBe(before);
    });

    it("should contain the same cards after shuffle", () => {
      const deck = new DrawDeck();
      const beforeIds = deck.deck.map((c) => c.id).sort();
      deck.shuffleDeck();
      const afterIds = deck.deck.map((c) => c.id).sort();
      expect(afterIds).toEqual(beforeIds);
    });
  });
});
