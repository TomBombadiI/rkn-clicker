import { create } from "zustand";
import { applyClick, applyTick, buyBan, buyMax, buySlow } from "../../engine/actions";
import { getPassiveIncomePerSec } from "../../engine/calculations";
import { GAME_BALANCE, getEventDelayMs, PURCHASE_EVENTS } from "../../engine/config";
import { createInitialState } from "../../engine/state";
import { clearSavedGame, loadGame, saveGame } from "../../infra/storage";
import type { ActiveEvent, GameState, ServiceId, ServiceState, ServiceTier } from "../../engine/types";

type PurchaseButtonView = {
  label: string;
  disabled: boolean;
};

export type ActionLogEntry = {
  message: string;
  createdAt: number;
};

export type ServiceCardView = {
  id: ServiceId;
  name: string;
  tier: ServiceTier;
  state: ServiceState;
  slowCost: number;
  slowEffect: number;
  banCost: number;
  banMultiplier: number;
  slowButton: PurchaseButtonView;
  banButton: PurchaseButtonView;
};

export type MaxGoalView = {
  cost: number;
  unlocked: boolean;
  disabled: boolean;
  isFinished: boolean;
};

export type EventBannerView = {
  name: string;
  remainingMs: number;
  phase: "scheduled" | "active";
} | null;

type GameStore = {
  game: GameState;
  actionLog: ActionLogEntry[];
  click: (now?: number) => void;
  tick: (now?: number) => void;
  buySlow: (serviceId: ServiceId, now?: number) => void;
  buyBan: (serviceId: ServiceId, now?: number) => void;
  buyMax: (now?: number) => void;
  hydrate: (now?: number) => void;
  save: (now?: number) => void;
  reset: (now?: number) => void;
};

const MAX_ACTION_LOG_ENTRIES = 10;

function trimActionLog(entries: ActionLogEntry[]): ActionLogEntry[] {
  return entries.slice(0, MAX_ACTION_LOG_ENTRIES);
}

function pushActionLog(
  entries: ActionLogEntry[],
  message: string,
  now: number,
): ActionLogEntry[] {
  return trimActionLog([
    {
      message,
      createdAt: now,
    },
    ...entries,
  ]);
}

export const useGameStore = create<GameStore>((set) => ({
  game: createInitialState(),
  actionLog: [],

  click: (now = Date.now()) => {
    set((state) => {
      const nextGame = applyClick(state.game, now);
      const clickGain = Math.max(0, nextGame.score - state.game.score);

      return {
        game: nextGame,
        actionLog: pushActionLog(
          state.actionLog,
          `Клик: +${Math.round(clickGain)}`,
          now,
        ),
      };
    });
  },

  tick: (now) => {
    set((state) => ({
      game: applyTick(state.game, now),
    }));
  },

  buySlow: (serviceId, now = Date.now()) => {
    set((state) => {
      const settledGame = applyTick(state.game, now);
      const result = buySlow(settledGame, serviceId);

      if (!result.ok) {
        return {
          game: settledGame,
        };
      }

      const nextEvent: ActiveEvent = {
        ...PURCHASE_EVENTS.slow,
        startedAt: now + getEventDelayMs(),
      };

      return {
        game: {
          ...result.nextState,
          scheduledEvent: nextEvent,
        },
        actionLog: pushActionLog(
          state.actionLog,
          `Замедление куплено: ${serviceId}`,
          now,
        ),
      };
    });

    saveGame(useGameStore.getState().game, now);
  },

  buyBan: (serviceId, now = Date.now()) => {
    set((state) => {
      const settledGame = applyTick(state.game, now);
      const result = buyBan(settledGame, serviceId);

      if (!result.ok) {
        return {
          game: settledGame,
        };
      }

      const nextEvent: ActiveEvent = {
        ...PURCHASE_EVENTS.ban,
        startedAt: now + getEventDelayMs(),
      };

      return {
        game: {
          ...result.nextState,
          scheduledEvent: nextEvent,
        },
        actionLog: pushActionLog(
          state.actionLog,
          `Блокировка куплена: ${serviceId}`,
          now,
        ),
      };
    });

    saveGame(useGameStore.getState().game, now);
  },

  buyMax: (now = Date.now()) => {
    set((state) => {
      const settledGame = applyTick(state.game, now);
      const result = buyMax(settledGame);

      if (!result.ok) {
        return {
          game: settledGame,
        };
      }

      return {
        game: result.nextState,
        actionLog: pushActionLog(state.actionLog, "MAX заблокирован", now),
      };
    });

    saveGame(useGameStore.getState().game, now);
  },

  hydrate: (now = Date.now()) => {
    const loadedGame = loadGame(now);

    if (!loadedGame) {
      return;
    }

    set({
      game: loadedGame,
    });
  },

  save: (now = Date.now()) => {
    saveGame(useGameStore.getState().game, now);
    set((state) => ({
      actionLog: pushActionLog(state.actionLog, "Прогресс сохранен", now),
    }));
  },

  reset: (now = Date.now()) => {
    const nextGame = createInitialState(now);

    set({
      game: nextGame,
      actionLog: pushActionLog([], "Прогресс сброшен", now),
    });

    clearSavedGame();
    saveGame(nextGame, now);
  },
}));

export function selectGame(gameStore: GameStore): GameState {
  return gameStore.game;
}

export function selectScore(gameStore: GameStore): number {
  return gameStore.game.score;
}

export function selectPassiveIncome(gameStore: GameStore): number {
  return getPassiveIncomePerSec(gameStore.game);
}

export function selectBlockMultiplier(gameStore: GameStore): number {
  return gameStore.game.blockMultiplier;
}

export function selectDissentPercent(gameStore: GameStore): number {
  return gameStore.game.dissentPercent;
}

export function selectActionLog(gameStore: GameStore): ActionLogEntry[] {
  return gameStore.actionLog;
}

export function getServiceCards(game: GameState): ServiceCardView[] {
  return game.serviceConfigs.map((service) => {
    const serviceState = game.serviceProgresses[service.id];
    const canAffordSlow = game.score >= service.slowCost;
    const canAffordBan = game.score >= service.banCost;

    let slowButton: PurchaseButtonView;
    if (serviceState === "banned") {
      slowButton = { label: "Недоступно", disabled: true };
    } else if (serviceState === "slowed") {
      slowButton = { label: "Замедлено", disabled: true };
    } else if (!canAffordSlow) {
      slowButton = { label: "Недостаточно очков", disabled: true };
    } else {
      slowButton = { label: "Замедлить", disabled: false };
    }

    let banButton: PurchaseButtonView;
    if (serviceState === "banned") {
      banButton = { label: "Заблокировано", disabled: true };
    } else if (!canAffordBan) {
      banButton = { label: "Недостаточно очков", disabled: true };
    } else {
      banButton = { label: "Заблокировать", disabled: false };
    }

    return {
      id: service.id,
      name: service.name,
      tier: service.tier,
      state: serviceState,
      slowCost: service.slowCost,
      slowEffect: service.slowEffect,
      banCost: service.banCost,
      banMultiplier: service.banMultiplier,
      slowButton,
      banButton,
    };
  });
}

export function getMaxGoal(game: GameState): MaxGoalView {
  return {
    cost: GAME_BALANCE.maxBanCost,
    unlocked: game.maxUnlocked,
    disabled: !game.maxUnlocked || game.isFinished || game.score < GAME_BALANCE.maxBanCost,
    isFinished: game.isFinished,
  };
}

export function getEventBanner(game: GameState): EventBannerView {
  if (game.activeEvent) {
    const remainingMs = Math.max(0, game.activeEvent.startedAt + game.activeEvent.durationMs - game.lastTickAt);
    if (remainingMs > 0) {
      return {
        name: game.activeEvent.name,
        remainingMs,
        phase: "active",
      };
    }
  }

  if (!game.scheduledEvent) {
    return null;
  }

  const remainingMs = Math.max(0, game.scheduledEvent.startedAt - game.lastTickAt);
  if (remainingMs <= 0) {
    return null;
  }

  return {
    name: game.scheduledEvent.name,
    remainingMs,
    phase: "scheduled",
  };
}
