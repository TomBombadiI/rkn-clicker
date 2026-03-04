import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  initYandexSdk,
  readyYandexSdk,
  resetYandexSdkForTests,
} from '../../../infra/yandex';

describe('yandexSdk', () => {
  beforeEach(() => {
    delete window.YaGames;
    resetYandexSdkForTests();
    vi.restoreAllMocks();
  });

  it('falls back to safe no-op methods when YaGames is unavailable (smoke)', async () => {
    const sdk = await initYandexSdk();

    await expect(sdk.showFullscreenAd()).resolves.toMatchObject({ ok: false, status: 'unavailable' });
    await expect(sdk.showRewardedAd()).resolves.toMatchObject({ ok: false, status: 'unavailable' });
    await expect(readyYandexSdk()).resolves.toBeUndefined();
    expect(sdk.getEnvironment()).toEqual({
      lang: null,
      tld: null,
      appId: null,
      payload: null,
    });
    expect(sdk.subscribeToGameplayState({ onPause: vi.fn() })).toBeTypeOf('function');
  });

  it('initializes SDK once and calls ready once even on repeated startup hooks (regression guard)', async () => {
    const readySpy = vi.fn();
    const initSpy = vi.fn(async () => ({
      features: {
        LoadingAPI: {
          ready: readySpy,
        },
      },
    }));

    window.YaGames = {
      init: initSpy,
    };

    await readyYandexSdk();
    await readyYandexSdk();

    expect(initSpy).toHaveBeenCalledTimes(1);
    expect(readySpy).toHaveBeenCalledTimes(1);
  });

  it('forwards gameplay start/stop and subscribes to pause-resume events', async () => {
    const startSpy = vi.fn();
    const stopSpy = vi.fn();
    const onSpy = vi.fn();
    const offSpy = vi.fn();
    const handlers = new Map<string, () => void>();

    onSpy.mockImplementation((eventName: string, handler: () => void) => {
      handlers.set(eventName, handler);
    });

    window.YaGames = {
      init: vi.fn(async () => ({
        features: {
          GameplayAPI: {
            start: startSpy,
            stop: stopSpy,
          },
        },
        environment: {
          i18n: {
            lang: 'ru',
            tld: 'ru',
          },
          app: {
            id: 'demo-app',
          },
          payload: 'payload-1',
        },
        on: onSpy,
        off: offSpy,
      })),
    };

    const sdk = await initYandexSdk();
    const onPause = vi.fn();
    const onResume = vi.fn();
    const unsubscribe = sdk.subscribeToGameplayState({ onPause, onResume });

    sdk.startGameplay();
    sdk.stopGameplay();
    handlers.get('game_api_pause')?.();
    handlers.get('game_api_resume')?.();
    unsubscribe();

    expect(startSpy).toHaveBeenCalledTimes(1);
    expect(stopSpy).toHaveBeenCalledTimes(1);
    expect(onPause).toHaveBeenCalledTimes(1);
    expect(onResume).toHaveBeenCalledTimes(1);
    expect(onSpy).toHaveBeenCalledTimes(2);
    expect(offSpy).toHaveBeenCalledTimes(2);
    expect(sdk.getEnvironment()).toEqual({
      lang: 'ru',
      tld: 'ru',
      appId: 'demo-app',
      payload: 'payload-1',
    });
  });

  it('maps ad callbacks to detailed result statuses', async () => {
    window.YaGames = {
      init: vi.fn(async () => ({
        adv: {
          showFullscreenAdv: (options?: { callbacks?: { onClose?: (wasShown?: boolean) => void; onError?: () => void } }) => {
            options?.callbacks?.onClose?.(true);
          },
          showRewardedVideo: (options?: { callbacks?: { onRewarded?: () => void; onClose?: () => void; onOpen?: () => void; onError?: () => void } }) => {
            options?.callbacks?.onRewarded?.();
            options?.callbacks?.onClose?.();
          },
        },
      })),
    };

    const sdk = await initYandexSdk();

    await expect(sdk.showFullscreenAd()).resolves.toMatchObject({ ok: true, status: 'shown' });
    await expect(sdk.showRewardedAd()).resolves.toMatchObject({ ok: true, status: 'rewarded' });
  });

  it('reports rewarded ad close without reward and sdk errors', async () => {
    window.YaGames = {
      init: vi.fn(async () => ({
        adv: {
          showRewardedVideo: (options?: { callbacks?: { onClose?: () => void; onError?: (error?: unknown) => void } }) => {
            options?.callbacks?.onClose?.();
          },
        },
      })),
    };

    const sdk = await initYandexSdk();

    await expect(sdk.showRewardedAd()).resolves.toMatchObject({
      ok: false,
      status: 'closed_without_reward',
      message: 'Реклама закрыта до получения награды.',
    });

    resetYandexSdkForTests();
    window.YaGames = {
      init: vi.fn(async () => ({
        adv: {
          showRewardedVideo: (options?: { callbacks?: { onError?: (error?: unknown) => void } }) => {
            options?.callbacks?.onError?.('no fill');
          },
        },
      })),
    };

    const sdkWithError = await initYandexSdk();

    await expect(sdkWithError.showRewardedAd()).resolves.toMatchObject({
      ok: false,
      status: 'error',
      message: 'no fill',
    });
  });
});
