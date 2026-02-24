import type { ActiveEvent, EventMultipliers, GameState } from "./types";

export function getEventMultipliers(activeEvent: ActiveEvent|null): EventMultipliers {
    return activeEvent?.multipliers ?? {
        clickMultiplier: 1,
        passiveMultiplier: 1,
    };
}

export function getPassiveIncomePerSec(state: GameState): number {
    return state.basePassiveIncome * 
        state.blockMultiplier * 
        getEventMultipliers(state.activeEvent).passiveMultiplier;
}

export function getClickIncome(state: GameState): number {
    return state.clickPower * 
        state.blockMultiplier * 
        getEventMultipliers(state.activeEvent).clickMultiplier;
}
