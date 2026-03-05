import { describe, expect, it } from "vitest";
import { GAME_BALANCE, GAME_EVENTS, PURCHASE_EVENTS, REWARDED_EVENT_IDS, getEventDelayMs, getRandomPurchaseEventId, SERVICES } from "../../engine/config";

describe("getEventDelayMs", () => {
  it("returns the minimum delay when randomValue is 0 (smoke)", () => {
    expect(getEventDelayMs(0)).toBe(GAME_BALANCE.eventWindowMinMs);
  });

  it("returns the maximum delay when randomValue is 1 (edge-case)", () => {
    expect(getEventDelayMs(1)).toBe(GAME_BALANCE.eventWindowMaxMs);
  });
});

describe("SERVICES", () => {
  it("matches the current 17-service progression grid (regression guard)", () => {
    expect(SERVICES).toHaveLength(17);
    expect(new Set(SERVICES.map((service) => service.tier))).toEqual(new Set([1, 2, 3, 4]));
    expect(SERVICES[0].id).toBe("linkedin");
    expect(SERVICES[0].slowCost).toBe(30);
    expect(SERVICES[0].banCost).toBe(100);
    expect(SERVICES[SERVICES.length - 1].id).toBe("google");
  });
});

describe("GAME_EVENTS", () => {
  it("provides 20 mixed events with rewardable positive entries (regression guard)", () => {
    expect(GAME_EVENTS).toHaveLength(20);
    expect(GAME_EVENTS.some((event) => event.category === "negative")).toBe(true);
    expect(REWARDED_EVENT_IDS.length).toBeGreaterThan(0);
    expect(REWARDED_EVENT_IDS).toContain("traffic-surge");
    expect(REWARDED_EVENT_IDS).toContain("sponsor-drop");
  });
});

describe("getRandomPurchaseEventId", () => {
  it("picks events from purchasable timed pool boundaries (regression guard)", () => {
    expect(PURCHASE_EVENTS.length).toBeGreaterThan(0);

    const first = getRandomPurchaseEventId(0);
    const last = getRandomPurchaseEventId(0.999999);

    expect(first).toBe(PURCHASE_EVENTS[0].id);
    expect(last).toBe(PURCHASE_EVENTS[PURCHASE_EVENTS.length - 1].id);
    expect(PURCHASE_EVENTS.every((event) => event.durationMs > 0 && !event.rewardOnly)).toBe(true);
  });
});

