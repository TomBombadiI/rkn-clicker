import { z } from "zod";
import { GAME_BALANCE, SERVICES } from "../../engine/config";
import { createInitialState } from "../../engine/state";
import type { GameState, SaveData, ServiceId, ServiceState } from "../../engine/types";

const serviceStateSchema = z.enum(["none", "slowed", "banned"]);

const saveDataSchema = z.object({
  saveVersion: z.number().int(),
  score: z.number().nonnegative(),
  clickPower: z.number().nonnegative(),
  basePassiveIncome: z.number().nonnegative(),
  blockMultiplier: z.number().positive(),
  serviceProgresses: z.record(z.string(), serviceStateSchema),
  bannedCount: z.number().int().nonnegative(),
  dissentPercent: z.number().int().min(0).max(100),
  maxUnlocked: z.boolean(),
  isFinished: z.boolean(),
  lastSavedAt: z.number(),
});

function hasStorage(): boolean {
  return typeof window !== "undefined" && "localStorage" in window;
}

function normalizeServiceProgresses(
  persisted: Record<string, ServiceState>,
): Record<ServiceId, ServiceState> {
  return Object.fromEntries(
    SERVICES.map((service) => {
      const persistedState = persisted[service.id];
      const nextState = serviceStateSchema.safeParse(persistedState).success
        ? persistedState
        : "none";

      return [service.id, nextState];
    }),
  ) as Record<ServiceId, ServiceState>;
}

function toSaveData(game: GameState, now = Date.now()): SaveData {
  return {
    saveVersion: game.saveVersion,
    score: game.score,
    clickPower: game.clickPower,
    basePassiveIncome: game.basePassiveIncome,
    blockMultiplier: game.blockMultiplier,
    serviceProgresses: game.serviceProgresses,
    bannedCount: game.bannedCount,
    dissentPercent: game.dissentPercent,
    maxUnlocked: game.maxUnlocked,
    isFinished: game.isFinished,
    lastSavedAt: now,
  };
}

export function saveGame(game: GameState, now = Date.now()): void {
  if (!hasStorage()) {
    return;
  }

  const payload = JSON.stringify(toSaveData(game, now));
  window.localStorage.setItem(GAME_BALANCE.saveStorageKey, payload);
}

export function loadGame(now = Date.now()): GameState | null {
  if (!hasStorage()) {
    return null;
  }

  const rawValue = window.localStorage.getItem(GAME_BALANCE.saveStorageKey);
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue);
    const result = saveDataSchema.safeParse(parsed);

    if (!result.success) {
      return null;
    }

    if (result.data.saveVersion !== GAME_BALANCE.saveVersion) {
      return null;
    }

    const initialState = createInitialState(now);
    const serviceProgresses = normalizeServiceProgresses(result.data.serviceProgresses);
    const bannedCount = Object.values(serviceProgresses).filter((state) => state === "banned").length;
    const dissentPercent = Math.floor((bannedCount / initialState.serviceConfigs.length) * 100);
    const maxUnlocked = dissentPercent >= 100;

    return {
      ...initialState,
      score: result.data.score,
      clickPower: result.data.clickPower,
      basePassiveIncome: result.data.basePassiveIncome,
      blockMultiplier: result.data.blockMultiplier,
      serviceProgresses,
      bannedCount,
      dissentPercent,
      maxUnlocked,
      isFinished: result.data.isFinished,
      saveVersion: result.data.saveVersion,
      lastTickAt: now,
    };
  } catch {
    return null;
  }
}

export function clearSavedGame(): void {
  if (!hasStorage()) {
    return;
  }

  window.localStorage.removeItem(GAME_BALANCE.saveStorageKey);
}
