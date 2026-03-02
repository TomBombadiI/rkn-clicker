import { beforeEach, describe, expect, it } from "vitest";
import { useGameStore } from "../../../app/state";

describe("gameStore", () => {
  beforeEach(() => {
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
});
