import { getClickIncome, getPassiveIncomePerSec, isEventActive } from "./calculations";
import { GAME_BALANCE, RUNTIME_LIMITS } from "./config";
import type { BuyActionResult, GameState, ServiceId } from "./types";

function activateScheduledEvent(state: GameState): GameState {
    if (!state.scheduledEvent) {
        return state;
    }

    return {
        ...state,
        activeEvent: state.scheduledEvent,
        scheduledEvent: null,
    };
}

function clearExpiredEvent(state: GameState, now: number): GameState {
    if (!state.activeEvent || isEventActive(state.activeEvent, now)) {
        return state;
    }

    return {
        ...state,
        activeEvent: null,
    };
}

function synchronizeInstantEvents(state: GameState, now: number): GameState {
    let nextState = clearExpiredEvent(state, now);

    if (!nextState.activeEvent && nextState.scheduledEvent && nextState.scheduledEvent.startedAt <= now) {
        nextState = activateScheduledEvent(nextState);
        nextState = clearExpiredEvent(nextState, now);
    }

    return nextState;
}

export function applyClick(state: GameState, now = Date.now()): GameState {
    if (state.isFinished) {
        return state;
    }

    const syncedState = synchronizeInstantEvents(state, now);
    const score = syncedState.score + getClickIncome(syncedState);
    return {...syncedState, score};
}

export function applyTick(state: GameState, now = Date.now()): GameState {
    if (state.isFinished) {
        return {...state, lastTickAt: now};
    }

    let simulationState = clearExpiredEvent(state, state.lastTickAt);
    if (!simulationState.activeEvent && simulationState.scheduledEvent && simulationState.scheduledEvent.startedAt <= simulationState.lastTickAt) {
        simulationState = activateScheduledEvent(simulationState);
    }

    const deltaMs = Math.max(0, Math.min(now - state.lastTickAt, RUNTIME_LIMITS.maxDeltaMs));
    const tickStartedAt = simulationState.lastTickAt;
    const tickEndedAt = tickStartedAt + deltaMs;

    let cursor = tickStartedAt;
    let score = simulationState.score;
    let runtimeState = simulationState;

    while (cursor < tickEndedAt) {
        let nextBoundary = tickEndedAt;

        if (runtimeState.activeEvent) {
            nextBoundary = Math.min(
                nextBoundary,
                runtimeState.activeEvent.startedAt + runtimeState.activeEvent.durationMs,
            );
        } else if (runtimeState.scheduledEvent) {
            nextBoundary = Math.min(
                nextBoundary,
                runtimeState.scheduledEvent.startedAt,
            );
        }

        const segmentMs = Math.max(0, nextBoundary - cursor);
        score += getPassiveIncomePerSec(runtimeState) * (segmentMs / 1000);
        cursor = nextBoundary;

        if (runtimeState.activeEvent && cursor >= runtimeState.activeEvent.startedAt + runtimeState.activeEvent.durationMs) {
            runtimeState = {
                ...runtimeState,
                activeEvent: null,
            };
            continue;
        }

        if (!runtimeState.activeEvent && runtimeState.scheduledEvent && cursor >= runtimeState.scheduledEvent.startedAt) {
            runtimeState = activateScheduledEvent(runtimeState);
        }
    }

    const nextState = synchronizeInstantEvents(
        {
            ...runtimeState,
            score,
            lastTickAt: now,
        },
        now,
    );

    return nextState;
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

