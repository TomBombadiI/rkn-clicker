import type { EventId, EventTemplate, ServiceConfig } from "./types";

export const GAME_BALANCE = {
    saveVersion: 1,
    saveStorageKey: "rkn-clicker-save",
    settingsStorageKey: "rkn-clicker-settings",
    maxBanCost: 25_000_000_000,
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
        id: 'linkedin',
        name: 'LinkedIn',
        description: 'Вызывает вопросы у надзорных органов: чиновники считают подозрительным, что люди слишком часто ищут там работу вместо того, чтобы ждать распределения судьбы.',
        tier: 1,
        slowCost: 30,
        slowEffect: 1,
        banCost: 100,
        banMultiplier: 2,
    },
    {
        id: 'anime-site',
        name: 'Anime Site',
        description: 'Фигурирует в аналитических сводках как источник чрезмерно выразительных глаз, непроверенных моральных ориентиров и тревожно вдохновляющих сюжетных арок.',
        tier: 1,
        slowCost: 200,
        slowEffect: 1,
        banCost: 320,
        banMultiplier: 2,
    },
    {
        id: 'facebook',
        name: 'Facebook',
        description: 'Считается подозрительной площадкой, где граждане слишком охотно вспоминают старые связи, а государство предпочитает, чтобы некоторые знакомые терялись навсегда.',
        tier: 1,
        slowCost: 640,
        slowEffect: 1,
        banCost: 1_020,
        banMultiplier: 2,
    },
    {
        id: 'viber',
        name: 'Viber',
        description: 'Вызывает осторожность у регулятора как канал, в котором семейные чаты живут дольше ведомственных реформ и пересылают открытки без централизованного согласования.',
        tier: 1,
        slowCost: 2_050,
        slowEffect: 1,
        banCost: 3_280,
        banMultiplier: 2,
    },
    {
        id: 'reddit',
        name: 'Reddit',
        description: 'Регулярно попадает в служебные записки: эксперты опасаются, что система плюсов и минусов формирует у граждан несанкционированное чувство общественного мнения.',
        tier: 2,
        slowCost: 6_560,
        slowEffect: 1,
        banCost: 10_500,
        banMultiplier: 2,
    },
    {
        id: 'wikipedia',
        name: 'Wikipedia',
        description: 'Оценивается как нестабильный источник знаний: статьи там меняются быстрее, чем успевают обновляться официально одобренные версии реальности.',
        tier: 2,
        slowCost: 21_000,
        slowEffect: 1,
        banCost: 33_600,
        banMultiplier: 2,
    },
    {
        id: 'x',
        name: 'X',
        description: 'Слишком удобен для мгновенного распространения мнений: ведомства беспокоит, что короткая фраза может долететь до людей раньше длинного разъяснения.',
        tier: 2,
        slowCost: 67_200,
        slowEffect: 1,
        banCost: 107_500,
        banMultiplier: 2,
    },
    {
        id: 'tiktok',
        name: 'TikTok',
        description: 'Регулярно рассматривается как угроза стратегической концентрации, поскольку за пятнадцать секунд пользователь успевает узнать больше, чем планировалось на квартал.',
        tier: 2,
        slowCost: 215_000,
        slowEffect: 1,
        banCost: 344_000,
        banMultiplier: 2,
    },
    {
        id: 'instagram',
        name: 'Instagram',
        description: 'Попадает в поле зрения из-за систематического культивирования красивой жизни, которая иногда выглядит убедительнее утвержденной статистики.',
        tier: 2,
        slowCost: 688_000,
        slowEffect: 2,
        banCost: 1_100_000,
        banMultiplier: 2,
    },
    {
        id: 'whatsapp',
        name: 'WhatsApp',
        description: 'Считается излишне живучим мессенджером: сообщения в нем доходят даже тогда, когда регулятор уже морально отменил саму возможность переписки.',
        tier: 3,
        slowCost: 2_200_000,
        slowEffect: 4,
        banCost: 3_520_000,
        banMultiplier: 3,
    },
    {
        id: 'discord',
        name: 'Discord',
        description: 'Выглядит подозрительно из-за голосовых комнат, где люди способны часами координироваться без единого утвержденного модератора из районной администрации.',
        tier: 3,
        slowCost: 7_040_000,
        slowEffect: 9,
        banCost: 11_260_000,
        banMultiplier: 3,
    },
    {
        id: 'youtube',
        name: 'YouTube',
        description: 'Вызывает особый интерес как хранилище мнений, инструкций и комментариев, где алгоритмы иногда продвигают ролики без консультации с вертикалью управления.',
        tier: 3,
        slowCost: 22_520_000,
        slowEffect: 20,
        banCost: 36_030_000,
        banMultiplier: 3,
    },
    {
        id: 'telegram',
        name: 'Telegram',
        description: 'Стабильно тревожит ведомства тем, что каналы, чаты и боты образуют слишком удобную экосистему для новостей, слухов и самоуверенных инсайдов.',
        tier: 3,
        slowCost: 72_060_000,
        slowEffect: 45,
        banCost: 115_300_000,
        banMultiplier: 3,
    },
    {
        id: 'twitch',
        name: 'Twitch',
        description: 'Рассматривается как платформа повышенного риска: прямой эфир опасен уже тем, что зрители могут увидеть что-то до того, как это успеют правильно объяснить.',
        tier: 3,
        slowCost: 230_600_000,
        slowEffect: 100,
        banCost: 369_000_000,
        banMultiplier: 3,
    },
    {
        id: 'cloudflare',
        name: 'Cloudflare',
        description: 'Считается технически неблагонадежным: комиссия подозревает, что слишком странно, когда сайт падает не сразу, а еще какое-то время продолжает работать.',
        tier: 4,
        slowCost: 738_000_000,
        slowEffect: 190,
        banCost: 1_180_800_000,
        banMultiplier: 4,
    },
    {
        id: 'github',
        name: 'GitHub',
        description: 'Вызывает техническое недоверие, потому что там тысячи людей координируют изменения в коде без обязательного визирования в трех бумажных экземплярах.',
        tier: 4,
        slowCost: 2_361_600_000,
        slowEffect: 425,
        banCost: 3_778_600_000,
        banMultiplier: 4,
    },
    {
        id: 'google',
        name: 'Google',
        description: 'Считается системно неудобным сервисом: он слишком быстро отвечает на вопросы, которые, по мнению отдельных комиссий, следовало бы сначала согласовать.',
        tier: 4,
        slowCost: 7_557_200_000,
        slowEffect: 950,
        banCost: 12_091_500_000,
        banMultiplier: 4,
    },
] as const satisfies readonly ServiceConfig[];

export const RUNTIME_LIMITS = {
    maxDeltaMs: 5000,
} as const;

export const GAME_EVENTS = [
    {
        id: 'traffic-surge',
        name: 'Паника в сети',
        category: 'positive',
        multipliers: { clickMultiplier: 1, passiveMultiplier: 2 },
        durationMs: 20_000,
        rewardable: true,
        rewardOnly: false,
    },
    {
        id: 'raid-mode',
        name: 'Режим ручной блокировки',
        category: 'positive',
        multipliers: { clickMultiplier: 2, passiveMultiplier: 1 },
        durationMs: 20_000,
        rewardable: true,
        rewardOnly: false,
    },
    {
        id: 'cache-breeze',
        name: 'Свежий кэш',
        category: 'positive',
        multipliers: { clickMultiplier: 1.2, passiveMultiplier: 1.5 },
        durationMs: 18_000,
        rewardable: false,
        rewardOnly: false,
    },
    {
        id: 'viral-thread',
        name: 'Вирусный тред',
        category: 'positive',
        multipliers: { clickMultiplier: 1.8, passiveMultiplier: 1 },
        durationMs: 16_000,
        rewardable: false,
        rewardOnly: false,
    },
    {
        id: 'night-shift',
        name: 'Ночная смена',
        category: 'positive',
        multipliers: { clickMultiplier: 1.3, passiveMultiplier: 1.3 },
        durationMs: 22_000,
        rewardable: false,
        rewardOnly: false,
    },
    {
        id: 'mirror-farm',
        name: 'Ферма зеркал',
        category: 'positive',
        multipliers: { clickMultiplier: 2.4, passiveMultiplier: 1.2 },
        durationMs: 15_000,
        rewardable: true,
        rewardOnly: false,
    },
    {
        id: 'hype-train',
        name: 'Поезд хайпа',
        category: 'positive',
        multipliers: { clickMultiplier: 1.1, passiveMultiplier: 3 },
        durationMs: 14_000,
        rewardable: true,
        rewardOnly: false,
    },
    {
        id: 'clean-route',
        name: 'Чистый маршрут',
        category: 'positive',
        multipliers: { clickMultiplier: 1.6, passiveMultiplier: 1.6 },
        durationMs: 12_000,
        rewardable: false,
        rewardOnly: false,
    },
    {
        id: 'slow-morning',
        name: 'Сонное утро',
        category: 'negative',
        multipliers: { clickMultiplier: 0.6, passiveMultiplier: 0.9 },
        durationMs: 18_000,
        rewardable: false,
        rewardOnly: false,
    },
    {
        id: 'dns-chaos',
        name: 'DNS-хаос',
        category: 'negative',
        multipliers: { clickMultiplier: 0.9, passiveMultiplier: 0.55 },
        durationMs: 16_000,
        rewardable: false,
        rewardOnly: false,
    },
    {
        id: 'audit-day',
        name: 'День проверок',
        category: 'negative',
        multipliers: { clickMultiplier: 0.75, passiveMultiplier: 0.75 },
        durationMs: 20_000,
        rewardable: false,
        rewardOnly: false,
    },
    {
        id: 'cable-cut',
        name: 'Порезанный кабель',
        category: 'negative',
        multipliers: { clickMultiplier: 0.5, passiveMultiplier: 0.8 },
        durationMs: 14_000,
        rewardable: false,
        rewardOnly: false,
    },
    {
        id: 'overload',
        name: 'Перегрузка узла',
        category: 'negative',
        multipliers: { clickMultiplier: 0.85, passiveMultiplier: 0.45 },
        durationMs: 15_000,
        rewardable: false,
        rewardOnly: false,
    },
    {
        id: 'shadow-ban',
        name: 'Теневой бан',
        category: 'negative',
        multipliers: { clickMultiplier: 0.65, passiveMultiplier: 0.65 },
        durationMs: 21_000,
        rewardable: false,
        rewardOnly: false,
    },
    {
        id: 'sponsor-drop',
        name: 'Спонсорский дроп',
        category: 'positive',
        multipliers: { clickMultiplier: 1, passiveMultiplier: 1 },
        durationMs: 0,
        rewardable: true,
        rewardOnly: true,
        instantScoreBase: 500,
    },
    {
        id: 'grant-committee',
        name: 'Грантовый комитет',
        category: 'positive',
        multipliers: { clickMultiplier: 1, passiveMultiplier: 1 },
        durationMs: 0,
        rewardable: true,
        rewardOnly: true,
        instantScoreBase: 2_500,
    },
    {
        id: 'emergency-subsidy',
        name: 'Экстренная субсидия',
        category: 'positive',
        multipliers: { clickMultiplier: 1, passiveMultiplier: 1 },
        durationMs: 0,
        rewardable: true,
        rewardOnly: true,
        instantScoreBase: 10_000,
    },
    {
        id: 'lucky-cache',
        name: 'Счастливый кэш',
        category: 'positive',
        multipliers: { clickMultiplier: 1.5, passiveMultiplier: 1.5 },
        durationMs: 10_000,
        rewardable: false,
        rewardOnly: false,
    },
    {
        id: 'backdoor-bonus',
        name: 'Чёрный ход',
        category: 'positive',
        multipliers: { clickMultiplier: 2, passiveMultiplier: 1.2 },
        durationMs: 13_000,
        rewardable: true,
        rewardOnly: false,
    },
    {
        id: 'maintenance-window',
        name: 'Окно техработ',
        category: 'negative',
        multipliers: { clickMultiplier: 0.8, passiveMultiplier: 0.6 },
        durationMs: 19_000,
        rewardable: false,
        rewardOnly: false,
    },
] as const satisfies readonly EventTemplate[];

export const EVENT_TEMPLATES = Object.fromEntries(
    GAME_EVENTS.map((event) => [event.id, event] as const),
) as Record<EventId, EventTemplate>;

export const REWARDED_EVENT_IDS = GAME_EVENTS
    .filter((event) => event.rewardable && event.category === 'positive')
    .map((event) => event.id);

export const PURCHASE_EVENTS = GAME_EVENTS.filter(
    (event) => event.durationMs > 0 && !event.rewardOnly,
);

export function getEventTemplate(eventId: EventId): EventTemplate | null {
    return EVENT_TEMPLATES[eventId] ?? null;
}

export function getRewardableEvents(): EventTemplate[] {
    return REWARDED_EVENT_IDS
        .map((eventId) => EVENT_TEMPLATES[eventId])
        .filter((event): event is EventTemplate => Boolean(event));
}

export function getRandomPurchaseEventId(randomValue = Math.random()): EventId {
    if (PURCHASE_EVENTS.length === 0) {
        return 'traffic-surge';
    }

    const normalizedRandom = Math.min(Math.max(randomValue, 0), 0.999999999999);
    const index = Math.floor(normalizedRandom * PURCHASE_EVENTS.length);

    return PURCHASE_EVENTS[index].id;
}

export function getEventDelayMs(randomValue = Math.random()): number {
    const normalizedRandom = Math.min(Math.max(randomValue, 0), 1);
    const range = GAME_BALANCE.eventWindowMaxMs - GAME_BALANCE.eventWindowMinMs;

    return GAME_BALANCE.eventWindowMinMs + Math.round(range * normalizedRandom);
}


