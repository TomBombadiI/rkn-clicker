import { getClickIncome, getEventMultipliers, getPassiveIncomePerSec } from "../../engine/calculations";
import type { ActiveEvent, GameState } from "../../engine/types";

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    score: 0,
    clickPower: 10,
    basePassiveIncome: 10,
    blockMultiplier: 1,
    serviceConfigs: [],
    serviceProgresses: {},
    activeEvent: null,
    bannedCount: 0,
    dissentPercent: 0,
    maxUnlocked: false,
    isFinished: false,
    lastTickAt: 123_456,
    saveVersion: 1,
    ...overrides,
  };
}

function makeEvent(overrides: Partial<ActiveEvent> = {}): ActiveEvent {
  return {
    id: "event",
    name: "event",
    multipliers: {
      clickMultiplier: 3,
      passiveMultiplier: 7,
    },
    startedAt: 1000,
    durationMs: 1000,
    ...overrides,
  };
}

describe("getEventMultipliers", () => {
  it("returns default multipliers when activeEvent is null (smoke)", () => {
    const multipliers = getEventMultipliers(null);

    expect(multipliers).toEqual({
      clickMultiplier: 1,
      passiveMultiplier: 1,
    });
  });
});

describe("getPassiveIncomePerSec", () => {
  it("calculates passive income without event using base formula (smoke)", () => {
    const state = makeState({
      basePassiveIncome: 10,
      blockMultiplier: 3,
      activeEvent: null,
    });

    expect(getPassiveIncomePerSec(state)).toBe(30);
  });
});

describe("getClickIncome", () => {
  it("calculates click income without event using base formula (smoke)", () => {
    const state = makeState({
      clickPower: 4,
      blockMultiplier: 5,
      activeEvent: null,
    });

    expect(getClickIncome(state)).toBe(20);
  });
});

describe("event multipliers interaction", () => {
  it("applies passive and click multipliers to their own formulas only (edge-case)", () => {
    const state = makeState({
      clickPower: 10,
      basePassiveIncome: 10,
      blockMultiplier: 2,
      activeEvent: makeEvent({
        multipliers: {
          clickMultiplier: 3,
          passiveMultiplier: 7,
        },
      }),
    });

    expect(getClickIncome(state)).toBe(60);
    expect(getPassiveIncomePerSec(state)).toBe(140);
  });
});

describe("regression guards", () => {
  it("keeps income equal to base values when blockMultiplier is 1 and no event", () => {
    const state = makeState({
      clickPower: 10,
      basePassiveIncome: 10,
      blockMultiplier: 1,
      activeEvent: null,
    });

    expect(getClickIncome(state)).toBe(state.clickPower);
    expect(getPassiveIncomePerSec(state)).toBe(state.basePassiveIncome);
  });

  it("returns finite income values for valid numeric state inputs", () => {
    const state = makeState();

    expect(Number.isFinite(getClickIncome(state))).toBe(true);
    expect(Number.isFinite(getPassiveIncomePerSec(state))).toBe(true);
  });
});
