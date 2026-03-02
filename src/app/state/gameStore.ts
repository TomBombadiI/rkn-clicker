import { create } from "zustand";
import { applyClick, applyTick, buyBan, buySlow } from "../../engine/actions";
import { getPassiveIncomePerSec } from "../../engine/calculations";
import { createInitialState } from "../../engine/state";
import type { GameState, ServiceId, ServiceState, ServiceTier } from "../../engine/types";

type PurchaseButtonView = {
  label: string;
  disabled: boolean;
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

type GameStore = {
  game: GameState;
  click: () => void;
  tick: (now?: number) => void;
  buySlow: (serviceId: ServiceId) => void;
  buyBan: (serviceId: ServiceId) => void;
  reset: (now?: number) => void;
};

export const useGameStore = create<GameStore>((set) => ({
  game: createInitialState(),

  click: () => {
    set((state) => ({
      game: applyClick(state.game),
    }));
  },

  tick: (now) => {
    set((state) => ({
      game: applyTick(state.game, now),
    }));
  },

  buySlow: (serviceId) => {
    set((state) => {
      const result = buySlow(state.game, serviceId);

      if (!result.ok) {
        return state;
      }

      return {
        game: result.nextState,
      };
    });
  },

  buyBan: (serviceId) => {
    set((state) => {
      const result = buyBan(state.game, serviceId);

      if (!result.ok) {
        return state;
      }

      return {
        game: result.nextState,
      };
    });
  },

  reset: (now) => {
    set({
      game: createInitialState(now),
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
