import { Player } from "../Player";
import { CardType } from "../../types/types";

// Helper to make a card quickly
const makeCard = (type: CardType, id: number) => ({ type, id, name: "Test" });

// Mock the Game object
const makeMockGame = () => ({
  drawDeck: {
    deck: [],
    seeFuture: jest.fn(),
    shuffleDeck: jest.fn(),
    replaceExplodingKitten: jest.fn(),
  },
  discardPile: { pile: [] },
  playerList: [] as Player[],
  activePlayer: null as any,
  numTurns: 1,
});

describe("Player", () => {
  describe("constructor", () => {
    it("should set name and playerNum", () => {
      const p = new Player("Riya", 1);
      expect(p.name).toBe("Riya");
      expect(p.playerNum).toBe(1);
    });

    it("should start with an empty hand", () => {
      const p = new Player("Riya", 1);
      expect(p.hand).toEqual([]);
    });

    it("should start with hasNope as false", () => {
      const p = new Player("Riya", 1);
      expect(p.hasNope).toBe(false);
    });
  });

  // I'm not sure if this is my tests that are wrong bc im misinterpreting what's supposed to happen or if the function is wrong.
  //  checkMove › should return false for a single cat card
  // checkMove › should return true for a single Attack card
  // it works when i make that line the opposite by adding !illegalSingles.includes(this.selectedCards[0].type); but again not sure if that's right
  describe("checkMove", () => {
    it("should return false for a single cat card", () => {
      const p = new Player("Riya", 1);
      p.selectedCards = [makeCard(CardType.Beard_Cat, 1)];
      expect(p.checkMove()).toBe(false);
    });

    it("should return true for a single Attack card", () => {
      const p = new Player("Riya", 1);
      p.selectedCards = [makeCard(CardType.Attack, 1)];
      expect(p.checkMove()).toBe(true);
    });

    it("should return true for two matching cat cards", () => {
      const p = new Player("Riya", 1);
      p.selectedCards = [
        makeCard(CardType.Tacocat, 1),
        makeCard(CardType.Tacocat, 2),
      ];
      expect(p.checkMove()).toBe(true);
    });

    it("should return false for two non-matching cards", () => {
      const p = new Player("Riya", 1);
      p.selectedCards = [
        makeCard(CardType.Tacocat, 1),
        makeCard(CardType.Beard_Cat, 2),
      ];
      expect(p.checkMove()).toBe(false);
    });

    it("should return true for three matching cards", () => {
      const p = new Player("Riya", 1);
      p.selectedCards = [
        makeCard(CardType.Tacocat, 1),
        makeCard(CardType.Tacocat, 2),
        makeCard(CardType.Tacocat, 3),
      ];
      expect(p.checkMove()).toBe(true);
    });

    it("should return false for 4 cards", () => {
      const p = new Player("Riya", 1);
      p.selectedCards = [1, 2, 3, 4].map((id) =>
        makeCard(CardType.Tacocat, id),
      );
      expect(p.checkMove()).toBe(false);
    });

    it("should return true for 5 different card types", () => {
      const p = new Player("Riya", 1);
      p.selectedCards = [
        makeCard(CardType.Tacocat, 1),
        makeCard(CardType.Beard_Cat, 2),
        makeCard(CardType.Attack, 3),
        makeCard(CardType.Favor, 4),
        makeCard(CardType.Nope, 5),
      ];
      expect(p.checkMove()).toBe(true);
    });
  });

  describe("lose", () => {
    it("should remove the player from the playerList", () => {
      const p1 = new Player("Riya", 1);
      const p2 = new Player("Bob", 2);
      const game = makeMockGame();
      game.playerList = [p1, p2];

      p1.lose(game as any);

      expect(game.playerList).not.toContain(p1);
      expect(game.playerList).toContain(p2);
    });

    it("should move the player hand to the discard pile", () => {
      const p = new Player("Riya", 1);
      const card = makeCard(CardType.Attack, 1);
      p.hand = [card];

      const game = makeMockGame();
      game.playerList = [p];
      p.lose(game as any);

      expect(game.discardPile.pile).toContain(card);
    });

    it("should set numTurns to 0", () => {
      const p = new Player("Riya", 1);
      const game = makeMockGame();
      game.playerList = [p];
      game.numTurns = 3;

      p.lose(game as any);

      expect(game.numTurns).toBe(0);
    });
  });
});
