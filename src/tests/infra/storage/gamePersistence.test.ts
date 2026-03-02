import { beforeEach, describe, expect, it } from "vitest";
import { GAME_BALANCE } from "../../../engine/config";
import { createInitialState } from "../../../engine/state";
import { clearSavedGame, loadGame, saveGame } from "../../../infra/storage";

describe("gamePersistence", () => {
  beforeEach(() => {
    clearSavedGame();
  });

  it("saves and restores game state (smoke)", () => {
    const game = createInitialState(100);
    game.score = 42;
    game.basePassiveIncome = 10;
    game.serviceProgresses.telegram = "slowed";

    saveGame(game, 200);
    const restoredGame = loadGame(300);

    expect(restoredGame).not.toBeNull();
    if (!restoredGame) return;

    expect(restoredGame.score).toBe(42);
    expect(restoredGame.basePassiveIncome).toBe(10);
    expect(restoredGame.serviceProgresses.telegram).toBe("slowed");
    expect(restoredGame.lastTickAt).toBe(300);
  });

  it("returns null for corrupted json (edge-case)", () => {
    window.localStorage.setItem(GAME_BALANCE.saveStorageKey, "{broken");

    expect(loadGame(500)).toBeNull();
  });

  it("returns null for unsupported saveVersion (regression guard)", () => {
    window.localStorage.setItem(
      GAME_BALANCE.saveStorageKey,
      JSON.stringify({
        saveVersion: 999,
        score: 10,
        clickPower: 1,
        basePassiveIncome: 0,
        blockMultiplier: 1,
        serviceProgresses: {},
        bannedCount: 0,
        dissentPercent: 0,
        maxUnlocked: false,
        isFinished: false,
        lastSavedAt: 0,
      }),
    );

    expect(loadGame(500)).toBeNull();
  });
});
