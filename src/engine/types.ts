export type ServiceState = 'none' | 'slowed' | 'banned';

export type ServiceTier = 1 | 2 | 3 | 4 | 5;

export type ServiceId = string;
export type EventId = string;

export type ServiceConfig = {
  id: ServiceId,
  name: string,
  tier: ServiceTier,
  slowCost: number,
  slowEffect: number,
  banCost: number,
  banMultiplier: number,
}

export type EventMultipliers = {
  clickMultiplier: number,
  passiveMultiplier: number,
}

export type ActiveEvent = {
  id: EventId,
  name: string,
  multipliers: EventMultipliers,
  startedAt: number,
  durationMs: number,
}

export type GameState = {
  score: number,
  clickPower: number,
  basePassiveIncome: number,
  blockMultiplier: number,
  serviceConfigs: ServiceConfig[],
  serviceProgresses: Record<ServiceId, ServiceState>,
  activeEvent: ActiveEvent | null,
  bannedCount: number,
  dissentPercent: number,
  maxUnlocked: boolean,
  isFinished: boolean,
  lastTickAt: number,
  saveVersion: number,
}

export type SaveData = {
  saveVersion: number,
  score: number,
  clickPower: number,
  basePassiveIncome: number,
  blockMultiplier: number,
  serviceProgresses: Record<ServiceId, ServiceState>,
  bannedCount: number,
  dissentPercent: number,
  maxUnlocked: boolean,
  isFinished: boolean,
  lastSavedAt: number,
}

export type BuyActionResult = {
  ok: true,
  nextState: GameState,
} | {
  ok: false,
  reason: 'not_enough_score' | 'already_banned' | 'already_slowed' | 'service_not_found',
}
