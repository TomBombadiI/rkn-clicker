import { GAME_BALANCE, SERVICES } from "./config";
import type { GameState, ServiceId, ServiceState } from "./types";

export function createInitialServiceProgresses(): Record<ServiceId, ServiceState> {
    return Object.fromEntries(
        SERVICES.map((service) => [service.id, 'none'] as const),
    ) as Record<ServiceId, ServiceState>;
}

export function createInitialState(now = Date.now()): GameState {
    return {
        score: GAME_BALANCE.initialScore,
        clickPower: GAME_BALANCE.initialClickPower,
        basePassiveIncome: GAME_BALANCE.initialBasePassiveIncome,
        blockMultiplier: GAME_BALANCE.initialBlockMultiplier,
        serviceConfigs: [...SERVICES],
        serviceProgresses: createInitialServiceProgresses(),
        activeEvent: null,
        bannedCount: 0,
        dissentPercent: 0,
        maxUnlocked: false,
        isFinished: false,
        lastTickAt: now,
        saveVersion: GAME_BALANCE.saveVersion,
    };
}