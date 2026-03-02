import { beforeEach, describe, expect, it } from "vitest";
import { GAME_BALANCE } from "../../../engine/config";
import { useGameStore } from "../../../app/state";

describe("gameStore", () => {
  beforeEach(() => {
    window.localStorage.clear();
    useGameStore.getState().reset(0);
  });

  it("does not apply new passive income retroactively when buying slow mid-tick (regression guard)", () => {
    useGameStore.getState().buySlow("telegram", 100);

    expect(useGameStore.getState().game.score).toBe(0);

    for (let i = 0; i < 10; i += 1) {
      useGameStore.getState().click();
    }

    useGameStore.getState().buySlow("telegram", 100);

    const gameAfterPurchase = useGameStore.getState().game;
    expect(gameAfterPurchase.score).toBe(0);
    expect(gameAfterPurchase.basePassiveIncome).toBe(10);
    expect(gameAfterPurchase.lastTickAt).toBe(100);

    useGameStore.getState().tick(250);

    expect(useGameStore.getState().game.score).toBe(1.5);
  });

  it("saves progress after a successful purchase (smoke)", () => {
    for (let i = 0; i < 10; i += 1) {
      useGameStore.getState().click();
    }

    useGameStore.getState().buySlow("telegram", 100);

    const savedRaw = window.localStorage.getItem(GAME_BALANCE.saveStorageKey);
    expect(savedRaw).not.toBeNull();

    const saved = JSON.parse(savedRaw ?? "{}");
    expect(saved.score).toBe(0);
    expect(saved.basePassiveIncome).toBe(10);
    expect(saved.serviceProgresses.telegram).toBe("slowed");
  });
});
