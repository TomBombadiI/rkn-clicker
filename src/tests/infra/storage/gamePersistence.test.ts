import { beforeEach, describe, expect, it } from "vitest";
import { GAME_BALANCE } from "../../../engine/config";
import { createInitialState } from "../../../engine/state";
import { clearSavedGame, clearUiSettings, loadGame, loadUiSettings, saveGame, saveUiSettings } from "../../../infra/storage";

describe("gamePersistence", () => {
  beforeEach(() => {
    clearSavedGame();
    clearUiSettings();
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
    expect(restoredGame.scheduledEvent).toBeNull();
    expect(restoredGame.lastTickAt).toBe(300);
  });

  it("restores activeEvent and scheduledEvent from save data (regression guard)", () => {
    const game = createInitialState(1_000);
    game.activeEvent = {
      id: "raid-mode",
      name: "Режим ручной блокировки",
      multipliers: {
        clickMultiplier: 2,
        passiveMultiplier: 1,
      },
      startedAt: 1_500,
      durationMs: 20_000,
    };
    game.scheduledEvent = {
      id: "traffic-surge",
      name: "Паника в сети",
      multipliers: {
        clickMultiplier: 1,
        passiveMultiplier: 2,
      },
      startedAt: 25_000,
      durationMs: 20_000,
    };

    saveGame(game, 2_000);
    const restoredGame = loadGame(3_000);

    expect(restoredGame).not.toBeNull();
    if (!restoredGame) return;

    expect(restoredGame.activeEvent).toEqual(game.activeEvent);
    expect(restoredGame.scheduledEvent).toEqual(game.scheduledEvent);
    expect(restoredGame.lastTickAt).toBe(3_000);
  });

  it("saves and restores ui settings independently from game save (smoke)", () => {
    saveUiSettings({
      soundEnabled: false,
      effectsVolume: 0.25,
      musicVolume: 0.75,
    });

    const restoredSettings = loadUiSettings();

    expect(restoredSettings).toEqual({
      soundEnabled: false,
      effectsVolume: 0.25,
      musicVolume: 0.75,
    });
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
        activeEvent: null,
        scheduledEvent: null,
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
