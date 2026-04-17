import { Player } from "../src/game-runner/Player";
import { Game } from "../src/game-runner/Game";
import { Card, CardType, CardRequestType } from "../src/types/types";

// Helper to build a minimal game with n players
function makeGame(numPlayers: number = 2): Game {
  const players = Array.from(
    { length: numPlayers },
    (_, i) => new Player(`Player${i}`, i, `uid${i}`),
  );
  const game = new Game(players);
  game.activePlayer = players[0];
  return game;
}

// Helper to make a card
function makeCard(type: CardType, id: number): Card {
  return { type, id, name: "Generic" };
}

describe("Player", () => {
  // --- checkMove ---

  test("checkMove: single Attack card is legal", () => {
    const game = makeGame();
    const player = game.playerList[0];
    player.selectedCards = [makeCard(CardType.Attack, 99)];
    expect(player.checkMove()).toBe(false); // Attack is NOT in illegalSingles, so checkMove returns false meaning it IS playable
  });

  test("checkMove: single Beard_Cat is illegal (returns true from illegalSingles)", () => {
    const game = makeGame();
    const player = game.playerList[0];
    player.selectedCards = [makeCard(CardType.Beard_Cat, 99)];
    expect(player.checkMove()).toBe(true);
  });

  test("checkMove: two matching cards is legal", () => {
    const game = makeGame();
    const player = game.playerList[0];
    player.selectedCards = [
      makeCard(CardType.Tacocat, 1),
      makeCard(CardType.Tacocat, 2),
    ];
    expect(player.checkMove()).toBe(true);
  });

  test("checkMove: two non-matching cards is illegal", () => {
    const game = makeGame();
    const player = game.playerList[0];
    player.selectedCards = [
      makeCard(CardType.Tacocat, 1),
      makeCard(CardType.Beard_Cat, 2),
    ];
    expect(player.checkMove()).toBe(false);
  });

  test("checkMove: three matching cards is legal", () => {
    const game = makeGame();
    const player = game.playerList[0];
    player.selectedCards = [
      makeCard(CardType.Catermelon, 1),
      makeCard(CardType.Catermelon, 2),
      makeCard(CardType.Catermelon, 3),
    ];
    expect(player.checkMove()).toBe(true);
  });

  test("checkMove: five all-different cards is legal", () => {
    const game = makeGame();
    const player = game.playerList[0];
    player.selectedCards = [
      makeCard(CardType.Attack, 1),
      makeCard(CardType.Favor, 2),
      makeCard(CardType.Skip, 3),
      makeCard(CardType.Shuffle, 4),
      makeCard(CardType.Nope, 5),
    ];
    expect(player.checkMove()).toBe(true);
  });

  test("checkMove: four cards returns false (unsupported count)", () => {
    const game = makeGame();
    const player = game.playerList[0];
    player.selectedCards = [
      makeCard(CardType.Attack, 1),
      makeCard(CardType.Attack, 2),
      makeCard(CardType.Attack, 3),
      makeCard(CardType.Attack, 4),
    ];
    expect(player.checkMove()).toBe(false);
  });

  // --- drawCard ---

  test("drawCard: throws error when it is not this player's turn", () => {
    const game = makeGame(2);
    const notActivePlayer = game.playerList[1];
    expect(() => notActivePlayer.drawCard(game)).toThrow("It is not your turn");
  });

  test("drawCard: non-exploding card is added to player hand", () => {
    const game = makeGame();
    const player = game.playerList[0];
    game.drawDeck.deck = [makeCard(CardType.Skip, 200)];
    const result = player.drawCard(game);
    expect(result.exploded).toBe(false);
    expect(player.hand.some((c) => c.id === 200)).toBe(true);
  });

  test("drawCard: drawing Nope sets hasNope to true", () => {
    const game = makeGame();
    const player = game.playerList[0];
    game.drawDeck.deck = [makeCard(CardType.Nope, 201)];
    player.drawCard(game);
    expect(player.hasNope).toBe(true);
  });

  test("drawCard: exploding kitten with defuse sets defusePending", () => {
    const game = makeGame();
    const player = game.playerList[0];
    // Give player a defuse card
    player.hand.push(makeCard(CardType.Defuse, 300));
    game.drawDeck.deck = [makeCard(CardType.Exploding_Kitten, 301)];
    const result = player.drawCard(game);
    expect(result.defusePending).toBe(true);
    expect(player.pendingDefuseKitten).not.toBeNull();
  });

  test("drawCard: exploding kitten without defuse causes player to lose", () => {
    const game = makeGame(2);
    const player = game.playerList[0];
    // Make sure player has no defuse
    player.hand = [];
    game.drawDeck.deck = [makeCard(CardType.Exploding_Kitten, 302)];
    const result = player.drawCard(game);
    expect(result.exploded).toBe(true);
    expect(game.playerList.includes(player)).toBe(false);
  });

  // --- resolveDefuse ---

  test("resolveDefuse: throws if no pending kitten", () => {
    const game = makeGame();
    const player = game.playerList[0];
    expect(() => player.resolveDefuse(game, 0)).toThrow(
      "No Exploding Kitten is currently pending defusal!",
    );
  });

  test("resolveDefuse: places kitten back in deck and clears pending", () => {
    const game = makeGame();
    const player = game.playerList[0];
    const kitten = makeCard(CardType.Exploding_Kitten, 400);
    player.pendingDefuseKitten = kitten;
    game.drawDeck.deck = [
      makeCard(CardType.Skip, 401),
      makeCard(CardType.Skip, 402),
    ];
    player.resolveDefuse(game, 1);
    expect(player.pendingDefuseKitten).toBeNull();
    expect(game.drawDeck.deck.some((c) => c.id === 400)).toBe(true);
  });

  // --- resolveFavor / combos ---

  test("resolveFavor: transfers specific card from target to player", () => {
    const game = makeGame();
    const player = game.playerList[0];
    const target = game.playerList[1];
    const card = makeCard(CardType.Skip, 500);
    target.hand.push(card);
    const stolen = player.resolveFavor(target, 500);
    expect(stolen.id).toBe(500);
    expect(player.hand.some((c) => c.id === 500)).toBe(true);
    expect(target.hand.some((c) => c.id === 500)).toBe(false);
  });

  test("resolveTwoCardCombo: steals a random card from target", () => {
    const game = makeGame();
    const player = game.playerList[0];
    const target = game.playerList[1];
    target.hand = [makeCard(CardType.Attack, 600)];
    const stolen = player.resolveTwoCardCombo(target);
    expect(stolen.id).toBe(600);
    expect(player.hand.some((c) => c.id === 600)).toBe(true);
    expect(target.hand.length).toBe(0);
  });

  test("resolveTwoCardCombo: throws if target has no cards", () => {
    const game = makeGame();
    const player = game.playerList[0];
    const target = game.playerList[1];
    target.hand = [];
    expect(() => player.resolveTwoCardCombo(target)).toThrow(
      "Target player has no cards.",
    );
  });

  test("resolveThreeCardCombo: returns null if target lacks requested card type", () => {
    const game = makeGame();
    const player = game.playerList[0];
    const target = game.playerList[1];
    target.hand = [makeCard(CardType.Skip, 700)];
    const result = player.resolveThreeCardCombo(target, CardType.Attack);
    expect(result).toBeNull();
  });

  test("resolveThreeCardCombo: steals correct card type from target", () => {
    const game = makeGame();
    const player = game.playerList[0];
    const target = game.playerList[1];
    target.hand = [makeCard(CardType.Attack, 800)];
    const stolen = player.resolveThreeCardCombo(target, CardType.Attack);
    expect(stolen?.id).toBe(800);
    expect(target.hand.length).toBe(0);
  });

  // --- playCard ---

  test("playCard: Skip decrements numTurns", () => {
    const game = makeGame();
    const player = game.playerList[0];
    const skipCard = makeCard(CardType.Skip, 900);
    player.hand.push(skipCard);
    game.numTurns = 2;
    player.playCard(skipCard, game);
    expect(game.numTurns).toBe(1);
  });

  test("playCard: Shuffle calls shuffleDeck without error", () => {
    const game = makeGame();
    const player = game.playerList[0];
    const shuffleCard = makeCard(CardType.Shuffle, 901);
    player.hand.push(shuffleCard);
    expect(() => player.playCard(shuffleCard, game)).not.toThrow();
  });

  test("playCard: Favor returns cardRequest of Favor type", () => {
    const game = makeGame();
    const player = game.playerList[0];
    const favorCard = makeCard(CardType.Favor, 902);
    player.hand.push(favorCard);
    const result = player.playCard(favorCard, game);
    expect(result.cardRequest).toBe(CardRequestType.Favor);
  });

  test("playCard: See_the_Future returns futureCards array", () => {
    const game = makeGame();
    const player = game.playerList[0];
    const stfCard = makeCard(CardType.See_the_Future, 903);
    player.hand.push(stfCard);
    const result = player.playCard(stfCard, game);
    expect(Array.isArray(result.futureCards)).toBe(true);
  });

  test("playCard: playing illegal single returns empty object", () => {
    const game = makeGame();
    const player = game.playerList[0];
    const beardCat = makeCard(CardType.Beard_Cat, 904);
    player.hand.push(beardCat);
    const result = player.playCard(beardCat, game);
    expect(result).toEqual({});
  });

  // --- lose ---

  test("lose: removes player from playerList", () => {
    const game = makeGame(3);
    const player = game.playerList[0];
    player.lose(game);
    expect(game.playerList.includes(player)).toBe(false);
  });

  test("lose: player hand cards go to discard pile", () => {
    const game = makeGame(3);
    const player = game.playerList[0];
    const card = makeCard(CardType.Skip, 1000);
    player.hand = [card];
    player.lose(game);
    expect(game.discardPile.pile.some((c) => c.id === 1000)).toBe(true);
  });
});

// --- playSelectedCards ---

test("playSelectedCards: throws if not active player", () => {
  const game = makeGame(2);
  const notActive = game.playerList[1];
  expect(() => notActive.playSelectedCards(game, [])).toThrow(
    "It is not your turn!",
  );
});

test("playSelectedCards: returns empty if card id not in hand", () => {
  const game = makeGame();
  const player = game.playerList[0];
  const result = player.playSelectedCards(game, [9999]);
  expect(result).toEqual({});
});

test("playSelectedCards: single card delegates to playCard", () => {
  const game = makeGame();
  const player = game.playerList[0];
  const favor = makeCard(CardType.Favor, 50);
  player.hand.push(favor);
  const result = player.playSelectedCards(game, [50]);
  expect(result.cardRequest).toBe(CardRequestType.Favor);
});

test("playSelectedCards: two matching cards returns Two_Card_Combo request", () => {
  const game = makeGame();
  const player = game.playerList[0];
  player.hand.push(makeCard(CardType.Tacocat, 51));
  player.hand.push(makeCard(CardType.Tacocat, 52));
  const result = player.playSelectedCards(game, [51, 52]);
  expect(result.cardRequest).toBe(CardRequestType.Two_Card_Combo);
});

test("playSelectedCards: three matching cards returns Three_Card_Combo request", () => {
  const game = makeGame();
  const player = game.playerList[0];
  player.hand.push(makeCard(CardType.Beard_Cat, 53));
  player.hand.push(makeCard(CardType.Beard_Cat, 54));
  player.hand.push(makeCard(CardType.Beard_Cat, 55));
  const result = player.playSelectedCards(game, [53, 54, 55]);
  expect(result.cardRequest).toBe(CardRequestType.Three_Card_Combo);
});

// --- Attack card ---

test("playCard: Attack with numTurns=1 ends turn and sets next player turns to 2", () => {
  const game = makeGame(2);
  const player = game.playerList[0];
  const attack = makeCard(CardType.Attack, 60);
  player.hand.push(attack);
  game.numTurns = 1;
  player.playCard(attack, game);
  expect(game.numTurns).toBe(2);
});

test("playCard: Attack with numTurns>1 stores extra turns", () => {
  const game = makeGame(2);
  const player = game.playerList[0];
  const attack = makeCard(CardType.Attack, 61);
  player.hand.push(attack);
  game.numTurns = 3;
  player.playCard(attack, game);
  expect(game.numTurns).toBe(4); // 2 + (3-1) stored
});

// --- Skip ending turn ---

test("playCard: Skip with numTurns=1 ends the turn", () => {
  const game = makeGame(2);
  const player = game.playerList[0];
  const skip = makeCard(CardType.Skip, 62);
  player.hand.push(skip);
  game.numTurns = 1;
  player.playCard(skip, game);
  expect(game.activePlayer).toBe(game.playerList[1]);
});

// --- getters ---

test("player getters return correct constructed values", () => {
  const player = new Player("Alice", 3, "abc123");
  expect(player.name).toBe("Alice");
  expect(player.playerNum).toBe(3);
  expect(player.userId).toBe("abc123");
});
