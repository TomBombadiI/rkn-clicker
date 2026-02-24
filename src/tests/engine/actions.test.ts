import { describe, expect, it } from "vitest";
import { applyClick, applyTick, buyBan, buySlow } from "../../engine/actions";
import { RUNTIME_LIMITS, SERVICES } from "../../engine/config";
import { createInitialState } from "../../engine/state";
import type { GameState, ServiceId } from "../../engine/types";

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...createInitialState(1_000),
    ...overrides,
  };
}

describe("applyClick", () => {
  it("adds click income and returns a new state (smoke)", () => {
    const state = makeState({ score: 10, clickPower: 3, blockMultiplier: 2 });

    const next = applyClick(state);

    expect(next.score).toBe(16);
    expect(next).not.toBe(state);
    expect(state.score).toBe(10);
  });
});

describe("applyTick", () => {
  it("adds passive income by delta time and updates lastTickAt (smoke)", () => {
    const state = makeState({
      score: 0,
      basePassiveIncome: 20,
      blockMultiplier: 2,
      lastTickAt: 1_000,
    });

    const next = applyTick(state, 2_000);

    expect(next.score).toBe(40);
    expect(next.lastTickAt).toBe(2_000);
  });

  it("clamps delta by RUNTIME_LIMITS.maxDeltaMs (edge-case)", () => {
    const state = makeState({
      score: 0,
      basePassiveIncome: 10,
      blockMultiplier: 1,
      lastTickAt: 0,
    });

    const next = applyTick(state, RUNTIME_LIMITS.maxDeltaMs + 10_000);

    expect(next.score).toBe(10 * (RUNTIME_LIMITS.maxDeltaMs / 1000));
  });

  it("does not reduce score when now is behind lastTickAt (regression guard)", () => {
    const state = makeState({
      score: 123,
      basePassiveIncome: 50,
      lastTickAt: 5_000,
    });

    const next = applyTick(state, 4_000);

    expect(next.score).toBe(123);
    expect(next.lastTickAt).toBe(4_000);
  });
});

describe("buySlow", () => {
  it("buys slow when enough score and applies effects (smoke)", () => {
    const serviceId: ServiceId = SERVICES[0].id;
    const state = makeState({
      score: SERVICES[0].slowCost + 5,
    });

    const result = buySlow(state, serviceId);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.nextState.score).toBe(5);
    expect(result.nextState.basePassiveIncome).toBe(
      state.basePassiveIncome + SERVICES[0].slowEffect,
    );
    expect(result.nextState.serviceProgresses[serviceId]).toBe("slowed");
    expect(result.nextState).not.toBe(state);
    expect(state.serviceProgresses[serviceId]).toBe("none");
  });

  it("returns not_enough_score when score is insufficient (edge-case)", () => {
    const serviceId: ServiceId = SERVICES[1].id;
    const state = makeState({ score: SERVICES[1].slowCost - 1 });

    const result = buySlow(state, serviceId);

    expect(result).toEqual({ ok: false, reason: "not_enough_score" });
  });

  it("blocks slow for already banned service (regression guard)", () => {
    const serviceId: ServiceId = SERVICES[0].id;
    const state = makeState({
      serviceProgresses: {
        ...createInitialState().serviceProgresses,
        [serviceId]: "banned",
      },
    });

    const result = buySlow(state, serviceId);

    expect(result).toEqual({ ok: false, reason: "already_banned" });
  });
});

describe("buyBan", () => {
  it("buys ban and updates multiplier, counts, and dissentPercent (smoke)", () => {
    const serviceId: ServiceId = SERVICES[0].id;
    const state = makeState({
      score: SERVICES[0].banCost + 1,
    });

    const result = buyBan(state, serviceId);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.nextState.score).toBe(1);
    expect(result.nextState.serviceProgresses[serviceId]).toBe("banned");
    expect(result.nextState.blockMultiplier).toBe(
      state.blockMultiplier * SERVICES[0].banMultiplier,
    );
    expect(result.nextState.bannedCount).toBe(1);
    expect(result.nextState.dissentPercent).toBe(25);
    expect(result.nextState.maxUnlocked).toBe(false);
  });

  it("allows ban after slow state (edge-case)", () => {
    const serviceId: ServiceId = SERVICES[2].id;
    const slowedState = makeState({
      score: SERVICES[2].banCost + 10,
      serviceProgresses: {
        ...createInitialState().serviceProgresses,
        [serviceId]: "slowed",
      },
    });

    const result = buyBan(slowedState, serviceId);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.nextState.serviceProgresses[serviceId]).toBe("banned");
  });

  it("sets maxUnlocked at 100% dissent (regression guard)", () => {
    const lastServiceId: ServiceId = SERVICES[3].id;
    const state = makeState({
      score: SERVICES[3].banCost + 1,
      bannedCount: 3,
      dissentPercent: 75,
      serviceProgresses: {
        [SERVICES[0].id]: "banned",
        [SERVICES[1].id]: "banned",
        [SERVICES[2].id]: "banned",
        [SERVICES[3].id]: "none",
      },
    });

    const result = buyBan(state, lastServiceId);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.nextState.bannedCount).toBe(4);
    expect(result.nextState.dissentPercent).toBe(100);
    expect(result.nextState.maxUnlocked).toBe(true);
  });
});
