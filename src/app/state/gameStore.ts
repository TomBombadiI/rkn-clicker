import { create } from "zustand";
import { applyClick, applyTick, buyBan, buyMax, buySlow } from "../../engine/actions";
import { getPassiveIncomePerSec } from "../../engine/calculations";
import {
  GAME_BALANCE,
  getEventDelayMs,
  getEventTemplate,
  getRandomPurchaseEventId,
  getRewardableEvents,
} from "../../engine/config";
import { createInitialState } from "../../engine/state";
import { clearSavedGame, loadGame, loadUiSettings, saveGame, saveUiSettings } from "../../infra/storage";
import type { ActiveEvent, EventId, EventTemplate, GameState, ServiceId, ServiceState, ServiceTier } from "../../engine/types";

type PurchaseButtonView = {
  label: string;
  disabled: boolean;
};

type ActionErrorReason =
  | "not_enough_score"
  | "already_banned"
  | "already_slowed"
  | "service_not_found"
  | "max_locked"
  | "already_finished"
  | "event_not_found";

export type ToastTone = "info" | "success" | "error";

export type ToastView = {
  id: number;
  message: string;
  tone: ToastTone;
};

export type ServiceCardView = {
  id: ServiceId;
  name: string;
  description: string;
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

export type EventBannerEffectView = {
  label: string;
  tone: "buff" | "debuff";
};

export type EventBannerView = {
  name: string;
  remainingMs: number;
  durationMs: number;
  effects: EventBannerEffectView[];
} | null;

type GameStore = {
  game: GameState;
  toasts: ToastView[];
  soundEnabled: boolean;
  effectsVolume: number;
  musicVolume: number;
  click: (now?: number) => void;
  tick: (now?: number) => void;
  buySlow: (serviceId: ServiceId, now?: number) => void;
  buyBan: (serviceId: ServiceId, now?: number) => void;
  buyMax: (now?: number) => void;
  hydrate: (now?: number) => void;
  save: (now?: number) => void;
  saveManually: (now?: number) => void;
  reset: (now?: number) => void;
  showToast: (message: string, tone?: ToastTone) => void;
  dismissToast: (toastId: number) => void;
  triggerInstantEvent: (eventId: EventId, now?: number) => void;
  toggleSound: () => void;
  setEffectsVolume: (volume: number) => void;
  setMusicVolume: (volume: number) => void;
};

const MAX_VISIBLE_TOASTS = 3;
const DEFAULT_EFFECTS_VOLUME = 0.6;
const DEFAULT_MUSIC_VOLUME = 0.45;
let nextToastId = 0;

function pushToast(
  toasts: ToastView[],
  message: string,
  tone: ToastTone,
): ToastView[] {
  nextToastId += 1;

  return [...toasts, { id: nextToastId, message, tone }].slice(-MAX_VISIBLE_TOASTS);
}

function clampSoundVolume(volume: number, fallback: number): number {
  if (Number.isNaN(volume)) {
    return fallback;
  }

  return Math.min(1, Math.max(0, volume));
}

function getActionErrorMessage(reason: ActionErrorReason): string {
  switch (reason) {
    case "not_enough_score":
      return "Недостаточно очков для этого действия.";
    case "already_banned":
      return "Сервис уже заблокирован.";
    case "already_slowed":
      return "Сервис уже замедлен.";
    case "service_not_found":
      return "Сервис не найден.";
    case "max_locked":
      return "MAX пока недоступен.";
    case "already_finished":
      return "Игра уже завершена.";
    case "event_not_found":
      return "Событие недоступно.";
  }
}

function createActiveEvent(template: EventTemplate, now: number): ActiveEvent {
  return {
    id: template.id,
    name: template.name,
    multipliers: template.multipliers,
    startedAt: now,
    durationMs: template.durationMs,
  };
}

function createScheduledEvent(eventId: EventId, startedAt: number): ActiveEvent | null {
  const template = getEventTemplate(eventId);
  if (!template || template.durationMs <= 0) {
    return null;
  }

  return createActiveEvent(template, startedAt);
}

function getUiSettingsSnapshot(state: Pick<GameStore, "soundEnabled" | "effectsVolume" | "musicVolume">) {
  return {
    soundEnabled: state.soundEnabled,
    effectsVolume: state.effectsVolume,
    musicVolume: state.musicVolume,
  };
}

function hasVisibleTimedEffect(template: EventTemplate): boolean {
  return template.durationMs > 0 && (
    template.multipliers.clickMultiplier !== 1 || template.multipliers.passiveMultiplier !== 1
  );
}

export const useGameStore = create<GameStore>((set) => ({
  game: createInitialState(),
  toasts: [],
  soundEnabled: true,
  effectsVolume: DEFAULT_EFFECTS_VOLUME,
  musicVolume: DEFAULT_MUSIC_VOLUME,

  click: (now = Date.now()) => {
    set((state) => ({
      game: applyClick(state.game, now),
    }));
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
          toasts: pushToast(state.toasts, getActionErrorMessage(result.reason), "error"),
        };
      }

      const nextEvent = createScheduledEvent(getRandomPurchaseEventId(), now + getEventDelayMs());

      return {
        game: {
          ...result.nextState,
          scheduledEvent: nextEvent,
        },
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
          toasts: pushToast(state.toasts, getActionErrorMessage(result.reason), "error"),
        };
      }

      const nextEvent = createScheduledEvent(getRandomPurchaseEventId(), now + getEventDelayMs());

      return {
        game: {
          ...result.nextState,
          scheduledEvent: nextEvent,
        },
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
          toasts: pushToast(state.toasts, getActionErrorMessage(result.reason), "error"),
        };
      }

      return {
        game: result.nextState,
      };
    });

    saveGame(useGameStore.getState().game, now);
  },

  hydrate: (now = Date.now()) => {
    const loadedGame = loadGame(now);
    const loadedUiSettings = loadUiSettings();

    if (!loadedGame && !loadedUiSettings) {
      return;
    }

    set((state) => ({
      game: loadedGame ?? state.game,
      soundEnabled: loadedUiSettings?.soundEnabled ?? state.soundEnabled,
      effectsVolume: loadedUiSettings?.effectsVolume ?? state.effectsVolume,
      musicVolume: loadedUiSettings?.musicVolume ?? state.musicVolume,
    }));
  },

  save: (now = Date.now()) => {
    saveGame(useGameStore.getState().game, now);
  },

  saveManually: (now = Date.now()) => {
    saveGame(useGameStore.getState().game, now);
    set((state) => ({
      toasts: pushToast(state.toasts, "Прогресс сохранен.", "success"),
    }));
  },

  reset: (now = Date.now()) => {
    const nextGame = createInitialState(now);

    set((state) => ({
      game: nextGame,
      soundEnabled: state.soundEnabled,
      effectsVolume: state.effectsVolume,
      musicVolume: state.musicVolume,
      toasts: pushToast([], "Прогресс сброшен.", "success"),
    }));

    clearSavedGame();
    saveGame(nextGame, now);
  },

  showToast: (message, tone = "info") => {
    set((state) => ({
      toasts: pushToast(state.toasts, message, tone),
    }));
  },

  dismissToast: (toastId) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== toastId),
    }));
  },

  triggerInstantEvent: (eventId, now = Date.now()) => {
    set((state) => {
      const settledGame = applyTick(state.game, now);

      if (settledGame.isFinished) {
        return {
          game: settledGame,
          toasts: pushToast(state.toasts, getActionErrorMessage("already_finished"), "error"),
        };
      }

      const template = getEventTemplate(eventId);
      if (!template || !template.rewardable) {
        return {
          game: settledGame,
          toasts: pushToast(state.toasts, getActionErrorMessage("event_not_found"), "error"),
        };
      }

      const grantedScore = (template.instantScoreBase ?? 0) * settledGame.blockMultiplier;
      const nextState: GameState = {
        ...settledGame,
        score: settledGame.score + grantedScore,
      };

      if (!hasVisibleTimedEffect(template)) {
        return {
          game: nextState,
        };
      }

      return {
        game: {
          ...nextState,
          activeEvent: createActiveEvent(template, now),
          scheduledEvent: null,
        },
      };
    });

    saveGame(useGameStore.getState().game, now);
  },

  toggleSound: () => {
    set((state) => {
      const nextState = {
        soundEnabled: !state.soundEnabled,
      };

      saveUiSettings({
        ...getUiSettingsSnapshot(state),
        ...nextState,
      });

      return nextState;
    });
  },

  setEffectsVolume: (volume) => {
    set((state) => {
      const nextState = {
        effectsVolume: clampSoundVolume(volume, DEFAULT_EFFECTS_VOLUME),
      };

      saveUiSettings({
        ...getUiSettingsSnapshot(state),
        ...nextState,
      });

      return nextState;
    });
  },

  setMusicVolume: (volume) => {
    set((state) => {
      const nextState = {
        musicVolume: clampSoundVolume(volume, DEFAULT_MUSIC_VOLUME),
      };

      saveUiSettings({
        ...getUiSettingsSnapshot(state),
        ...nextState,
      });

      return nextState;
    });
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

export function selectToasts(gameStore: GameStore): ToastView[] {
  return gameStore.toasts;
}

export function selectSoundEnabled(gameStore: GameStore): boolean {
  return gameStore.soundEnabled;
}

export function selectEffectsVolume(gameStore: GameStore): number {
  return gameStore.effectsVolume;
}

export function selectMusicVolume(gameStore: GameStore): number {
  return gameStore.musicVolume;
}

export function getRewardEventCards() {
  return getRewardableEvents();
}

export function getServiceCards(game: GameState): ServiceCardView[] {
  return game.serviceConfigs
    .map((service) => {
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
        description: service.description,
        tier: service.tier,
        state: serviceState,
        slowCost: service.slowCost,
        slowEffect: service.slowEffect,
        banCost: service.banCost,
        banMultiplier: service.banMultiplier,
        slowButton,
        banButton,
      };
    })
    .sort((left, right) => {
      const leftBanned = left.state === "banned" ? 1 : 0;
      const rightBanned = right.state === "banned" ? 1 : 0;

      if (leftBanned !== rightBanned) {
        return leftBanned - rightBanned;
      }

      return 0;
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

function formatEventMultiplier(value: number): string {
  if (Number.isInteger(value)) {
    return value.toString();
  }

  return value.toFixed(2).replace(/\.0+$|0+$/g, "").replace(/\.$/, "");
}

function getEventEffects(game: GameState): EventBannerEffectView[] {
  if (!game.activeEvent) {
    return [];
  }

  const effects: EventBannerEffectView[] = [];
  const { clickMultiplier, passiveMultiplier } = game.activeEvent.multipliers;

  if (clickMultiplier !== 1) {
    effects.push({
      label: `Клик x${formatEventMultiplier(clickMultiplier)}`,
      tone: clickMultiplier > 1 ? "buff" : "debuff",
    });
  }

  if (passiveMultiplier !== 1) {
    effects.push({
      label: `Пассив x${formatEventMultiplier(passiveMultiplier)}`,
      tone: passiveMultiplier > 1 ? "buff" : "debuff",
    });
  }

  return effects;
}

export function getEventBanner(game: GameState): EventBannerView {
  if (!game.activeEvent) {
    return null;
  }

  const remainingMs = Math.max(0, game.activeEvent.startedAt + game.activeEvent.durationMs - game.lastTickAt);
  if (remainingMs <= 0) {
    return null;
  }

  return {
    name: game.activeEvent.name,
    remainingMs,
    durationMs: game.activeEvent.durationMs,
    effects: getEventEffects(game),
  };
}

