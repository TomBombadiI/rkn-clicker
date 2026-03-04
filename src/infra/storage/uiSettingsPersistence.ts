import { z } from "zod";
import { GAME_BALANCE } from "../../engine/config";

export type UiSettings = {
  soundEnabled: boolean;
  effectsVolume: number;
  musicVolume: number;
};

const uiSettingsSchema = z.object({
  soundEnabled: z.boolean(),
  effectsVolume: z.number().min(0).max(1),
  musicVolume: z.number().min(0).max(1),
});

function hasStorage(): boolean {
  return typeof window !== "undefined" && "localStorage" in window;
}

export function saveUiSettings(settings: UiSettings): void {
  if (!hasStorage()) {
    return;
  }

  window.localStorage.setItem(GAME_BALANCE.settingsStorageKey, JSON.stringify(settings));
}

export function loadUiSettings(): UiSettings | null {
  if (!hasStorage()) {
    return null;
  }

  const rawValue = window.localStorage.getItem(GAME_BALANCE.settingsStorageKey);
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue);
    const result = uiSettingsSchema.safeParse(parsed);

    if (!result.success) {
      return null;
    }

    return result.data;
  } catch {
    return null;
  }
}

export function clearUiSettings(): void {
  if (!hasStorage()) {
    return;
  }

  window.localStorage.removeItem(GAME_BALANCE.settingsStorageKey);
}
