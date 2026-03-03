import { describe, expect, it } from "vitest";
import { GAME_BALANCE, getEventDelayMs, SERVICES } from "../../engine/config";

describe("getEventDelayMs", () => {
  it("returns the minimum delay when randomValue is 0 (smoke)", () => {
    expect(getEventDelayMs(0)).toBe(GAME_BALANCE.eventWindowMinMs);
  });

  it("returns the maximum delay when randomValue is 1 (edge-case)", () => {
    expect(getEventDelayMs(1)).toBe(GAME_BALANCE.eventWindowMaxMs);
  });
});

describe("SERVICES", () => {
  it("matches the MVP 20-service progression grid (regression guard)", () => {
    expect(SERVICES).toHaveLength(20);
    expect(new Set(SERVICES.map((service) => service.tier))).toEqual(new Set([1, 2, 3, 4, 5]));
  });
});
