import { getClickIncome, getPassiveIncomePerSec } from "./calculations";
import { GAME_BALANCE, RUNTIME_LIMITS } from "./config";
import type { BuyActionResult, GameState, ServiceId } from "./types";

export function applyClick(state: GameState): GameState {
    if (state.isFinished) {
        return state;
    }

    const score = state.score + getClickIncome(state);
    return {...state, score};
}

export function applyTick(state: GameState, now = Date.now()): GameState {
    if (state.isFinished) {
        return {...state, lastTickAt: now};
    }

    const deltaMs = Math.max(0, Math.min(now - state.lastTickAt, RUNTIME_LIMITS.maxDeltaMs));
    const score = state.score + getPassiveIncomePerSec(state) * (deltaMs / 1000);
    const lastTickAt = now;

    return {...state, score, lastTickAt};
}

export function buySlow(state: GameState, serviceId: ServiceId): BuyActionResult {
    if (state.isFinished) {
        return {
            ok: false,
            reason: 'already_finished',
        };
    }

    const serviceProgress = state.serviceProgresses[serviceId];
    const serviceConfig = state.serviceConfigs.find((config) => config.id === serviceId);

    if (!serviceProgress || !serviceConfig) {
        return {
            ok: false,
            reason: 'service_not_found',
        };
    }

    if (serviceProgress === 'banned') {
        return {
            ok: false,
            reason: 'already_banned',
        };
    }

    if (serviceProgress === 'slowed') {
        return {
            ok: false,
            reason: 'already_slowed',
        };
    }

    if (state.score < serviceConfig.slowCost) {
        return {
            ok: false,
            reason: 'not_enough_score',
        };
    }

    const score = state.score - serviceConfig.slowCost;
    const serviceProgresses: GameState['serviceProgresses'] = {
        ...state.serviceProgresses, 
        [serviceId]: 'slowed'
    };
    const basePassiveIncome = state.basePassiveIncome + serviceConfig.slowEffect;

    return {
        ok: true,
        nextState: {...state, score, serviceProgresses, basePassiveIncome },
    };
}

export function buyBan(state: GameState, serviceId: ServiceId): BuyActionResult {
    if (state.isFinished) {
        return {
            ok: false,
            reason: 'already_finished',
        };
    }

    const serviceProgress = state.serviceProgresses[serviceId];
    const serviceConfig = state.serviceConfigs.find((config) => config.id === serviceId);

    if (!serviceProgress || !serviceConfig) {
        return {
            ok: false,
            reason: 'service_not_found',
        };
    }

    if (serviceProgress === 'banned') {
        return {
            ok: false,
            reason: 'already_banned',
        };
    }

    if (state.score < serviceConfig.banCost) {
        return {
            ok: false,
            reason: 'not_enough_score',
        };
    }

    const score = state.score - serviceConfig.banCost;
    const serviceProgresses: GameState['serviceProgresses'] = {
        ...state.serviceProgresses, 
        [serviceId]: 'banned'
    };    
    const blockMultiplier = state.blockMultiplier * serviceConfig.banMultiplier;
    const bannedCount = state.bannedCount + 1;
    const dissentPercent = Math.floor(
        state.serviceConfigs.filter(
            (config) => serviceProgresses[config.id] === 'banned'
        ).length / 
        state.serviceConfigs.length * 100,
    );
    const maxUnlocked = dissentPercent >= 100;

    return {
        ok: true,
        nextState: {...state, score, serviceProgresses, blockMultiplier, bannedCount, dissentPercent, maxUnlocked},
    };
}

export function buyMax(state: GameState): BuyActionResult {
    if (state.isFinished) {
        return {
            ok: false,
            reason: 'already_finished',
        };
    }

    if (!state.maxUnlocked) {
        return {
            ok: false,
            reason: 'max_locked',
        };
    }

    if (state.score < GAME_BALANCE.maxBanCost) {
        return {
            ok: false,
            reason: 'not_enough_score',
        };
    }

    const score = state.score - GAME_BALANCE.maxBanCost;

    return {
        ok: true,
        nextState: {...state, score, isFinished: true},
    };
}

