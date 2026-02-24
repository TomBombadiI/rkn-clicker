import { describe, expect, it } from "vitest";
import { GAME_BALANCE, SERVICES } from "../../engine/config";
import { createInitialServiceProgresses, createInitialState } from "../../engine/state";

describe("createInitialState", () => {
  it("uses initial values from GAME_BALANCE (smoke)", () => {
    const now = 123_456;
    const state = createInitialState(now);

    expect(state.score).toBe(GAME_BALANCE.initialScore);
    expect(state.clickPower).toBe(GAME_BALANCE.initialClickPower);
    expect(state.basePassiveIncome).toBe(GAME_BALANCE.initialBasePassiveIncome);
    expect(state.blockMultiplier).toBe(GAME_BALANCE.initialBlockMultiplier);
    expect(state.saveVersion).toBe(GAME_BALANCE.saveVersion);
    expect(state.lastTickAt).toBe(now);
    expect(state.activeEvent).toBeNull();
    expect(state.bannedCount).toBe(0);
    expect(state.dissentPercent).toBe(0);
    expect(state.maxUnlocked).toBe(false);
    expect(state.isFinished).toBe(false);
    expect(state.serviceConfigs).toEqual([...SERVICES]);
  });
});

describe("createInitialServiceProgresses", () => {
  it("sets all service states to 'none' (edge-case)", () => {
    const progresses = createInitialServiceProgresses();

    for (const service of SERVICES) {
      expect(progresses[service.id]).toBe("none");
    }
  });

  it("contains exactly service ids from config (regression guard)", () => {
    const progresses = createInitialServiceProgresses();
    const progressIds = Object.keys(progresses).sort();
    const serviceIds = SERVICES.map((service) => service.id).sort();

    expect(progressIds).toEqual(serviceIds);
  });
});
