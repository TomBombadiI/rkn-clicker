import { create } from "zustand";
import { applyClick, applyTick } from "../../engine/actions";
import { getPassiveIncomePerSec } from "../../engine/calculations";
import { createInitialState } from "../../engine/state";
import type { GameState } from "../../engine/types";

type GameStore = {
  game: GameState;
  click: () => void;
  tick: (now?: number) => void;
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
