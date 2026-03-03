import type { EventTemplate, ServiceConfig } from "./types";

export const GAME_BALANCE = {
    saveVersion: 1,
    saveStorageKey: "rkn-clicker-save",
    maxBanCost: 100,
    eventWindowMinMs: 20_000,
    eventWindowMaxMs: 60_000,
    initialScore: 0,
    initialClickPower: 1,
    initialBasePassiveIncome: 0,
    initialBlockMultiplier: 1,
    autosaveIntervalMs: 10000,
} as const;

export const SERVICES = [
    {
        id: 'telegram',
        name: 'Telegram',
        tier: 1,
        slowCost: 10,
        slowEffect: 10,
        banCost: 20,
        banMultiplier: 2,
    },
    {
        id: 'whatsapp',
        name: 'WhatsApp',
        tier: 1,
        slowCost: 50,
        slowEffect: 50,
        banCost: 100,
        banMultiplier: 2,
    },
    {
        id: 'instagram',
        name: 'Instagram',
        tier: 1,
        slowCost: 100,
        slowEffect: 100,
        banCost: 200,
        banMultiplier: 2,
    },
    {
        id: 'youtube',
        name: 'YouTube',
        tier: 1,
        slowCost: 250,
        slowEffect: 250,
        banCost: 500,
        banMultiplier: 2,
    },
] as const satisfies readonly ServiceConfig[];

export const RUNTIME_LIMITS = {
    maxDeltaMs: 5000,
} as const;

export const PURCHASE_EVENTS = {
    slow: {
        id: "traffic-surge",
        name: "Паника в сети",
        multipliers: {
            clickMultiplier: 1,
            passiveMultiplier: 2,
        },
        durationMs: 20_000,
    },
    ban: {
        id: "raid-mode",
        name: "Режим ручной блокировки",
        multipliers: {
            clickMultiplier: 2,
            passiveMultiplier: 1,
        },
        durationMs: 20_000,
    },
} as const satisfies Record<"slow" | "ban", EventTemplate>;

export function getEventDelayMs(randomValue = Math.random()): number {
    const normalizedRandom = Math.min(Math.max(randomValue, 0), 1);
    const range = GAME_BALANCE.eventWindowMaxMs - GAME_BALANCE.eventWindowMinMs;

    return GAME_BALANCE.eventWindowMinMs + Math.round(range * normalizedRandom);
}

