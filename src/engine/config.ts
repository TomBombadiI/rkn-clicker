import type { ServiceConfig } from "./types";

export const GAME_BALANCE = {
    saveVersion: 1,
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

