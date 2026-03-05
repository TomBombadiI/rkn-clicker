import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GAME_BALANCE, SERVICES } from "../../../engine/config";
import { useGameStore } from "../../../app/state";

describe("gameStore", () => {
  beforeEach(() => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    window.localStorage.clear();
    useGameStore.getState().reset(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not apply new passive income retroactively when buying slow mid-tick (regression guard)", () => {
    useGameStore.getState().buySlow("linkedin", 100);

    expect(useGameStore.getState().game.score).toBe(0);

    for (let i = 0; i < 30; i += 1) {
      useGameStore.getState().click();
    }

    useGameStore.getState().buySlow("linkedin", 100);

    const gameAfterPurchase = useGameStore.getState().game;
    expect(gameAfterPurchase.score).toBe(0);
    expect(gameAfterPurchase.basePassiveIncome).toBe(2);
    expect(gameAfterPurchase.lastTickAt).toBe(100);

    useGameStore.getState().tick(250);

    expect(useGameStore.getState().game.score).toBeCloseTo(0.3);
  });

  it("saves progress after a successful purchase (smoke)", () => {
    for (let i = 0; i < 30; i += 1) {
      useGameStore.getState().click();
    }

    useGameStore.getState().buySlow("linkedin", 100);

    const savedRaw = window.localStorage.getItem(GAME_BALANCE.saveStorageKey);
    expect(savedRaw).not.toBeNull();

    const saved = JSON.parse(savedRaw ?? "{}");
    expect(saved.score).toBe(0);
    expect(saved.basePassiveIncome).toBe(2);
    expect(saved.activeEvent).toBeNull();
    expect(saved.scheduledEvent.name).toBe("Паника в сети");
    expect(saved.serviceProgresses.linkedin).toBe("slowed");
  });

  it("adds an error toast when an action fails (smoke)", () => {
    useGameStore.setState({ toasts: [] });

    useGameStore.getState().buyMax(100);

    const { toasts } = useGameStore.getState();

    expect(toasts).toHaveLength(1);
    expect(toasts[0].tone).toBe("error");
    expect(toasts[0].message).toBe("MAX пока недоступен.");
  });

  it("does not apply new block multiplier retroactively when buying ban mid-tick (regression guard)", () => {
    useGameStore.setState((state) => ({
      game: {
        ...state.game,
        score: 100,
        basePassiveIncome: 10,
        lastTickAt: 0,
      },
    }));

    useGameStore.getState().buyBan("linkedin", 100);

    const gameAfterPurchase = useGameStore.getState().game;
    expect(gameAfterPurchase.score).toBe(1);
    expect(gameAfterPurchase.blockMultiplier).toBe(2);
    expect(gameAfterPurchase.lastTickAt).toBe(100);

    useGameStore.getState().tick(250);

    expect(useGameStore.getState().game.score).toBe(2.5);
  });

  it("finishes the game after buying MAX when it is unlocked (smoke)", () => {
    useGameStore.setState((state) => ({
      game: {
        ...state.game,
        score: GAME_BALANCE.maxBanCost,
        maxUnlocked: true,
        dissentPercent: 100,
        lastTickAt: 0,
      },
    }));

    useGameStore.getState().buyMax(100);

    expect(useGameStore.getState().game.isFinished).toBe(true);
    expect(useGameStore.getState().game.score).toBe(0);
  });

  it("reaches MAX from a fresh state through bans and the final purchase (smoke)", () => {
    const totalBanCost = SERVICES.reduce((total, service) => total + service.banCost, 0);

    useGameStore.setState((state) => ({
      game: {
        ...state.game,
        score: totalBanCost + GAME_BALANCE.maxBanCost,
      },
    }));

    SERVICES.forEach((service, index) => {
      useGameStore.getState().buyBan(service.id, 100 + index * 100);
    });

    const gameAfterAllBans = useGameStore.getState().game;
    expect(gameAfterAllBans.bannedCount).toBe(SERVICES.length);
    expect(gameAfterAllBans.dissentPercent).toBe(100);
    expect(gameAfterAllBans.maxUnlocked).toBe(true);
    expect(gameAfterAllBans.isFinished).toBe(false);

    useGameStore.getState().buyMax(500);

    const finishedGame = useGameStore.getState().game;
    expect(finishedGame.isFinished).toBe(true);
    expect(finishedGame.score).toBe(0);
  });

  it("schedules a purchase event and activates it when its start time comes (regression guard)", () => {
    useGameStore.setState((state) => ({
      game: {
        ...state.game,
        score: 30,
      },
    }));

    useGameStore.getState().buySlow("linkedin", 100);

    expect(useGameStore.getState().game.activeEvent).toBeNull();
    expect(useGameStore.getState().game.scheduledEvent?.name).toBe("Паника в сети");

    useGameStore.getState().tick(20_100);

    expect(useGameStore.getState().game.activeEvent?.name).toBe("Паника в сети");
    expect(useGameStore.getState().game.scheduledEvent).toBeNull();

    useGameStore.getState().tick(40_100);

    expect(useGameStore.getState().game.activeEvent).toBeNull();
  });

  it("starts an instant timed event immediately and clears the scheduled one (smoke)", () => {
    useGameStore.setState((state) => ({
      game: {
        ...state.game,
        scheduledEvent: {
          id: "traffic-surge",
          name: "Паника в сети",
          multipliers: {
            clickMultiplier: 1,
            passiveMultiplier: 2,
          },
          startedAt: 5_000,
          durationMs: 20_000,
        },
      },
    }));

    useGameStore.getState().triggerInstantEvent("raid-mode", 100);

    const { game } = useGameStore.getState();

    expect(game.activeEvent?.name).toBe("Режим ручной блокировки");
    expect(game.activeEvent?.startedAt).toBe(100);
    expect(game.scheduledEvent).toBeNull();
  });

  it("grants instant score bonus events scaled by block multiplier (edge-case)", () => {
    useGameStore.setState((state) => ({
      game: {
        ...state.game,
        score: 10,
        blockMultiplier: 3,
      },
    }));

    useGameStore.getState().triggerInstantEvent("sponsor-drop", 100);

    const { game } = useGameStore.getState();

    expect(game.score).toBe(1_510);
    expect(game.activeEvent).toBeNull();
  });

  it("restores audio settings from localStorage on hydrate (regression guard)", () => {
    window.localStorage.setItem(
      GAME_BALANCE.settingsStorageKey,
      JSON.stringify({
        soundEnabled: false,
        effectsVolume: 0.2,
        musicVolume: 0.8,
      }),
    );

    useGameStore.setState({
      soundEnabled: true,
      effectsVolume: 0.6,
      musicVolume: 0.45,
    });

    useGameStore.getState().hydrate(100);

    const state = useGameStore.getState();

    expect(state.soundEnabled).toBe(false);
    expect(state.effectsVolume).toBe(0.2);
    expect(state.musicVolume).toBe(0.8);
  });
});



