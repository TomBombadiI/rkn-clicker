type RawYandexEventName = 'game_api_pause' | 'game_api_resume';

type RawFullscreenAdvOptions = {
  callbacks?: {
    onClose?: (wasShown?: boolean) => void;
    onError?: (error?: unknown) => void;
  };
};

type RawRewardedVideoOptions = {
  callbacks?: {
    onOpen?: () => void;
    onRewarded?: () => void;
    onClose?: () => void;
    onError?: (error?: unknown) => void;
  };
};

type RawYandexSdk = {
  features?: {
    LoadingAPI?: {
      ready?: () => void;
    };
    GameplayAPI?: {
      start?: () => void;
      stop?: () => void;
    };
  };
  adv?: {
    showFullscreenAdv?: (options?: RawFullscreenAdvOptions) => void | Promise<unknown>;
    showRewardedVideo?: (options?: RawRewardedVideoOptions) => void | Promise<unknown>;
  };
  environment?: {
    app?: {
      id?: string;
    };
    i18n?: {
      lang?: string;
      tld?: string;
    };
    payload?: string;
  };
  on?: (eventName: RawYandexEventName, handler: () => void) => void;
  off?: (eventName: RawYandexEventName, handler: () => void) => void;
};

type RawYandexGamesApi = {
  init?: () => Promise<RawYandexSdk>;
};

export type YandexEnvironment = {
  lang: string | null;
  tld: string | null;
  appId: string | null;
  payload: string | null;
};

export type FullscreenAdResult = {
  ok: boolean;
  status: 'shown' | 'not_shown' | 'error' | 'unavailable';
  message: string;
};

export type RewardedAdResult = {
  ok: boolean;
  status: 'rewarded' | 'closed_without_reward' | 'error' | 'unavailable';
  message: string;
};

export type YandexSdkAdapter = {
  ready: () => void;
  startGameplay: () => void;
  stopGameplay: () => void;
  showFullscreenAd: () => Promise<FullscreenAdResult>;
  showRewardedAd: () => Promise<RewardedAdResult>;
  getEnvironment: () => YandexEnvironment;
  subscribeToGameplayState: (callbacks: {
    onPause?: () => void;
    onResume?: () => void;
  }) => () => void;
};

declare global {
  interface Window {
    YaGames?: RawYandexGamesApi;
  }
}

const SDK_SCRIPT_PATH = '/sdk.js';

const fallbackEnvironment: YandexEnvironment = {
  lang: null,
  tld: null,
  appId: null,
  payload: null,
};

const unavailableFullscreenResult: FullscreenAdResult = {
  ok: false,
  status: 'unavailable',
  message: 'Платформа не предоставила fullscreen-рекламу.',
};

const unavailableRewardedResult: RewardedAdResult = {
  ok: false,
  status: 'unavailable',
  message: 'Платформа не предоставила rewarded-рекламу.',
};

const fallbackAdapter: YandexSdkAdapter = {
  ready: () => {},
  startGameplay: () => {},
  stopGameplay: () => {},
  showFullscreenAd: async () => unavailableFullscreenResult,
  showRewardedAd: async () => unavailableRewardedResult,
  getEnvironment: () => fallbackEnvironment,
  subscribeToGameplayState: () => () => {},
};

let sdkPromise: Promise<YandexSdkAdapter> | null = null;
let sdkScriptPromise: Promise<boolean> | null = null;
let hasSentReady = false;

function isLocalHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

function shouldSkipSdkScriptLoad(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }

  return window.location.protocol === 'file:' || isLocalHost(window.location.hostname);
}

function ensureYandexSdkScript(): Promise<boolean> {
  if (sdkScriptPromise) {
    return sdkScriptPromise;
  }

  if (typeof document === 'undefined' || shouldSkipSdkScriptLoad()) {
    sdkScriptPromise = Promise.resolve(false);
    return sdkScriptPromise;
  }

  const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${SDK_SCRIPT_PATH}"]`);
  if (existingScript) {
    sdkScriptPromise = Promise.resolve(true);
    return sdkScriptPromise;
  }

  sdkScriptPromise = new Promise((resolve) => {
    const script = document.createElement('script');

    script.src = SDK_SCRIPT_PATH;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.head.appendChild(script);
  });

  return sdkScriptPromise;
}

function getEnvironment(rawSdk: RawYandexSdk): YandexEnvironment {
  return {
    lang: rawSdk.environment?.i18n?.lang ?? null,
    tld: rawSdk.environment?.i18n?.tld ?? null,
    appId: rawSdk.environment?.app?.id ?? null,
    payload: rawSdk.environment?.payload ?? null,
  };
}

function normalizeAdError(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  try {
    const serialized = JSON.stringify(error);
    if (serialized && serialized !== '{}') {
      return serialized;
    }
  } catch {
    // Ignore serialization issues and use fallback.
  }

  return fallbackMessage;
}

async function runFullscreenAd(
  action: ((options?: RawFullscreenAdvOptions) => void | Promise<unknown>) | undefined,
): Promise<FullscreenAdResult> {
  if (!action) {
    return unavailableFullscreenResult;
  }

  return new Promise((resolve) => {
    let settled = false;

    const finish = (result: FullscreenAdResult) => {
      if (settled) {
        return;
      }

      settled = true;
      resolve(result);
    };

    try {
      const maybePromise = action({
        callbacks: {
          onClose: (wasShown) => {
            if (wasShown) {
              finish({
                ok: true,
                status: 'shown',
                message: 'Fullscreen-реклама успешно показана.',
              });
              return;
            }

            finish({
              ok: false,
              status: 'not_shown',
              message: 'Платформа закрыла fullscreen-рекламу без показа.',
            });
          },
          onError: (error) => finish({
            ok: false,
            status: 'error',
            message: normalizeAdError(error, 'Fullscreen-реклама завершилась с ошибкой.'),
          }),
        },
      });

      if (maybePromise && typeof (maybePromise as Promise<unknown>).then === 'function') {
        void (maybePromise as Promise<unknown>).catch((error) => finish({
          ok: false,
          status: 'error',
          message: normalizeAdError(error, 'Fullscreen-реклама завершилась с ошибкой.'),
        }));
      }
    } catch (error) {
      finish({
        ok: false,
        status: 'error',
        message: normalizeAdError(error, 'Fullscreen-реклама завершилась с ошибкой.'),
      });
    }
  });
}

async function runRewardedAd(
  action: ((options?: RawRewardedVideoOptions) => void | Promise<unknown>) | undefined,
): Promise<RewardedAdResult> {
  if (!action) {
    return unavailableRewardedResult;
  }

  return new Promise((resolve) => {
    let settled = false;
    let hasReward = false;

    const finish = (result: RewardedAdResult) => {
      if (settled) {
        return;
      }

      settled = true;
      resolve(result);
    };

    try {
      const maybePromise = action({
        callbacks: {
          onOpen: () => {},
          onRewarded: () => {
            hasReward = true;
          },
          onClose: () => {
            if (hasReward) {
              finish({
                ok: true,
                status: 'rewarded',
                message: 'Награда за рекламу получена.',
              });
              return;
            }

            finish({
              ok: false,
              status: 'closed_without_reward',
              message: 'Реклама закрыта до получения награды.',
            });
          },
          onError: (error) => finish({
            ok: false,
            status: 'error',
            message: normalizeAdError(error, 'Rewarded-реклама завершилась с ошибкой.'),
          }),
        },
      });

      if (maybePromise && typeof (maybePromise as Promise<unknown>).then === 'function') {
        void (maybePromise as Promise<unknown>).catch((error) => finish({
          ok: false,
          status: 'error',
          message: normalizeAdError(error, 'Rewarded-реклама завершилась с ошибкой.'),
        }));
      }
    } catch (error) {
      finish({
        ok: false,
        status: 'error',
        message: normalizeAdError(error, 'Rewarded-реклама завершилась с ошибкой.'),
      });
    }
  });
}

function createAdapter(rawSdk: RawYandexSdk): YandexSdkAdapter {
  return {
    ready: () => {
      rawSdk.features?.LoadingAPI?.ready?.();
    },
    startGameplay: () => {
      rawSdk.features?.GameplayAPI?.start?.();
    },
    stopGameplay: () => {
      rawSdk.features?.GameplayAPI?.stop?.();
    },
    showFullscreenAd: () => runFullscreenAd(rawSdk.adv?.showFullscreenAdv),
    showRewardedAd: () => runRewardedAd(rawSdk.adv?.showRewardedVideo),
    getEnvironment: () => getEnvironment(rawSdk),
    subscribeToGameplayState: ({ onPause, onResume }) => {
      if (!rawSdk.on || !rawSdk.off) {
        return () => {};
      }

      const pauseHandler = () => {
        onPause?.();
      };
      const resumeHandler = () => {
        onResume?.();
      };

      rawSdk.on('game_api_pause', pauseHandler);
      rawSdk.on('game_api_resume', resumeHandler);

      return () => {
        rawSdk.off?.('game_api_pause', pauseHandler);
        rawSdk.off?.('game_api_resume', resumeHandler);
      };
    },
  };
}

export async function initYandexSdk(): Promise<YandexSdkAdapter> {
  if (sdkPromise) {
    return sdkPromise;
  }

  sdkPromise = (async () => {
    if (typeof window === 'undefined') {
      return fallbackAdapter;
    }

    if (!window.YaGames?.init) {
      await ensureYandexSdkScript();
    }

    if (!window.YaGames?.init) {
      return fallbackAdapter;
    }

    try {
      const rawSdk = await window.YaGames.init();
      return createAdapter(rawSdk);
    } catch {
      return fallbackAdapter;
    }
  })();

  return sdkPromise;
}

export async function readyYandexSdk(): Promise<void> {
  const sdk = await initYandexSdk();

  if (hasSentReady) {
    return;
  }

  sdk.ready();
  hasSentReady = true;
}

export function resetYandexSdkForTests(): void {
  sdkPromise = null;
  sdkScriptPromise = null;
  hasSentReady = false;
}
