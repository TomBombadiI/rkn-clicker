import { useEffect, useRef } from 'react';
import backgroundMusicSrc from '@/assets/caverns.ogg';
import { GAME_BALANCE } from '@/engine/config';
import {
  getMaxGoal,
  getServiceCards,
  selectGame,
  selectSoundEnabled,
  selectSoundVolume,
  selectToasts,
  useGameStore,
} from '@/app/state';
import { initYandexSdk, readyYandexSdk, type YandexSdkAdapter } from '@/infra/yandex';
import { Button } from '@/ui/shared/Button';
import { playUiSound } from '@/ui/shared/sound/playUiSound';
import { uiSounds } from '@/ui/shared/sound/uiSounds';
import { Toast } from '@/ui/shared/Toast';
import { ServicesTrigger } from '../../features/ServicesTrigger';
import { EndScreen } from '../../widgets/EndScreen';
import { EventBanner } from '../../widgets/EventBanner';
import { MainActionButton } from '../../widgets/MainActionButton';
import { TopBar } from '../../widgets/TopBar';
import s from './GamePage.module.scss';

type AvailableAction = {
  key: string;
  label: string;
};

const MAX_BADGE_COUNT = 9;

function getAvailableActions(game: ReturnType<typeof selectGame>): AvailableAction[] {
  const serviceCards = getServiceCards(game);
  const maxGoal = getMaxGoal(game);
  const actions: AvailableAction[] = [];

  serviceCards.forEach((service) => {
    if (!service.slowButton.disabled) {
      actions.push({
        key: `slow:${service.id}`,
        label: `Замедлить ${service.name}`,
      });
    }

    if (!service.banButton.disabled) {
      actions.push({
        key: `ban:${service.id}`,
        label: `Заблокировать ${service.name}`,
      });
    }
  });

  if (maxGoal.unlocked && !maxGoal.disabled) {
    actions.push({
      key: 'max',
      label: 'Заблокировать MAX',
    });
  }

  return actions;
}

function canPlayBackgroundAudio(): boolean {
  if (typeof Audio === 'undefined') {
    return false;
  }

  if (typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent)) {
    return false;
  }

  return true;
}

export function GamePage() {
  const game = useGameStore(selectGame);
  const soundEnabled = useGameStore(selectSoundEnabled);
  const soundVolume = useGameStore(selectSoundVolume);
  const toasts = useGameStore(selectToasts);
  const dismissToast = useGameStore((state) => state.dismissToast);
  const showToast = useGameStore((state) => state.showToast);
  const availableActions = getAvailableActions(game);
  const previousAvailableKeysRef = useRef<string[] | null>(null);
  const availabilityToastsReadyRef = useRef(false);
  const seenToastIdsRef = useRef(new Set<number>());
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  const yandexSdkRef = useRef<YandexSdkAdapter | null>(null);
  const tickIntervalIdRef = useRef<number | null>(null);
  const gameplayStopReasonsRef = useRef(new Set<string>());
  const isGameplayRunningRef = useRef(false);
  const isFinishedRef = useRef(game.isFinished);
  const soundEnabledRef = useRef(soundEnabled);
  const soundVolumeRef = useRef(soundVolume);
  const availableActionsCount = availableActions.length;
  const badgeCount = Math.min(availableActionsCount, MAX_BADGE_COUNT);
  const badgeLabel = availableActionsCount > MAX_BADGE_COUNT ? '9+' : String(badgeCount);

  const clearTickLoop = () => {
    if (tickIntervalIdRef.current === null) {
      return;
    }

    window.clearInterval(tickIntervalIdRef.current);
    tickIntervalIdRef.current = null;
  };

  const ensureTickLoop = () => {
    if (tickIntervalIdRef.current !== null) {
      return;
    }

    tickIntervalIdRef.current = window.setInterval(() => {
      useGameStore.getState().tick();
    }, 250);
  };

  const syncGameplayState = () => {
    const shouldRun = !isFinishedRef.current && gameplayStopReasonsRef.current.size === 0;

    if (shouldRun === isGameplayRunningRef.current) {
      return;
    }

    isGameplayRunningRef.current = shouldRun;

    if (shouldRun) {
      ensureTickLoop();
      yandexSdkRef.current?.startGameplay();
      return;
    }

    clearTickLoop();
    yandexSdkRef.current?.stopGameplay();
  };

  const setGameplayStopped = (reason: string, isStopped: boolean) => {
    if (isStopped) {
      gameplayStopReasonsRef.current.add(reason);
    } else {
      gameplayStopReasonsRef.current.delete(reason);
    }

    syncGameplayState();
  };

  const syncBackgroundMusic = () => {
    if (!canPlayBackgroundAudio()) {
      return;
    }

    if (!backgroundMusicRef.current) {
      const audio = new Audio(backgroundMusicSrc);
      audio.loop = true;
      audio.preload = 'auto';
      backgroundMusicRef.current = audio;
    }

    const audio = backgroundMusicRef.current;
    audio.volume = 0.12 * soundVolumeRef.current;

    const shouldPlay = soundEnabledRef.current && soundVolumeRef.current > 0 && !isFinishedRef.current && !document.hidden;

    if (!shouldPlay) {
      audio.pause();
      return;
    }

    try {
      const playback = audio.play();

      if (playback && typeof playback.catch === 'function') {
        void playback.catch(() => {
          // Ignore autoplay restrictions until the user interacts with the page.
        });
      }
    } catch {
      // Ignore playback errors: music is optional and should not block the game.
    }
  };

  useEffect(() => {
    if (!availabilityToastsReadyRef.current) {
      return;
    }

    const currentKeys = availableActions.map((action) => action.key);

    if (previousAvailableKeysRef.current === null) {
      previousAvailableKeysRef.current = currentKeys;
      return;
    }

    const previousKeys = new Set(previousAvailableKeysRef.current);

    availableActions
      .filter((action) => !previousKeys.has(action.key))
      .forEach((action) => {
        showToast(`Доступно: ${action.label}`, 'info');
      });

    previousAvailableKeysRef.current = currentKeys;
  }, [availableActions, showToast]);

  useEffect(() => {
    const activeToastIds = new Set(toasts.map((toast) => toast.id));

    toasts.forEach((toast) => {
      if (seenToastIdsRef.current.has(toast.id)) {
        return;
      }

      playUiSound(toast.tone === 'error' ? uiSounds.notifyError : uiSounds.notifyGood, {
        enabled: soundEnabled,
        volume: (toast.tone === 'error' ? 0.42 : 0.34) * soundVolume,
      });
      seenToastIdsRef.current.add(toast.id);
    });

    seenToastIdsRef.current.forEach((toastId) => {
      if (!activeToastIds.has(toastId)) {
        seenToastIdsRef.current.delete(toastId);
      }
    });
  }, [soundEnabled, soundVolume, toasts]);

  useEffect(() => {
    isFinishedRef.current = game.isFinished;
    soundEnabledRef.current = soundEnabled;
    soundVolumeRef.current = soundVolume;
    syncGameplayState();
    syncBackgroundMusic();
  }, [game.isFinished, soundEnabled, soundVolume]);

  useEffect(() => {
    useGameStore.getState().hydrate();
    previousAvailableKeysRef.current = getAvailableActions(useGameStore.getState().game).map((action) => action.key);
    seenToastIdsRef.current = new Set(useGameStore.getState().toasts.map((toast) => toast.id));
    availabilityToastsReadyRef.current = true;

    const autosaveIntervalId = window.setInterval(() => {
      useGameStore.getState().save();
    }, GAME_BALANCE.autosaveIntervalMs);

    const handlePageHide = () => {
      useGameStore.getState().save();
    };

    const handleVisibilityChange = () => {
      setGameplayStopped('document-hidden', document.hidden);
      syncBackgroundMusic();
    };

    let unsubscribeGameplayState = () => {};
    let isDisposed = false;

    void (async () => {
      const sdk = await initYandexSdk();

      if (isDisposed) {
        return;
      }

      yandexSdkRef.current = sdk;

      const environment = sdk.getEnvironment();
      if (environment.lang) {
        document.documentElement.lang = environment.lang;
      }

      unsubscribeGameplayState = sdk.subscribeToGameplayState({
        onPause: () => {
          setGameplayStopped('yandex-sdk', true);
        },
        onResume: () => {
          setGameplayStopped('yandex-sdk', false);
        },
      });

      if (!isFinishedRef.current && gameplayStopReasonsRef.current.size === 0) {
        sdk.startGameplay();
      }

      await readyYandexSdk();
    })();

    window.addEventListener('beforeunload', handlePageHide);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    handleVisibilityChange();
    syncGameplayState();
    syncBackgroundMusic();

    return () => {
      isDisposed = true;
      clearTickLoop();
      window.clearInterval(autosaveIntervalId);
      window.removeEventListener('beforeunload', handlePageHide);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      backgroundMusicRef.current?.pause();
      unsubscribeGameplayState();
      yandexSdkRef.current?.stopGameplay();
      yandexSdkRef.current = null;
    };
  }, []);

  if (game.isFinished) {
    return (
      <div className={s.gamePage}>
        <div className={s.shell}>
          <EndScreen />
        </div>
        <div className={s.toastStack}>
          {toasts.map((toast) => (
            <Toast key={toast.id} {...toast} onClose={dismissToast} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={s.gamePage}>
      <div className={s.shell}>
        <TopBar onSettingsOpenChange={(open) => setGameplayStopped('settings-modal', open)} />

        <div className={s.eventSlot}>
          <div className={s.eventInner}>
            <EventBanner />
          </div>
        </div>

        <section className={s.mainActionArea}>
          <MainActionButton />
        </section>

        <ServicesTrigger
          onOpenChange={(open) => setGameplayStopped('services-modal', open)}
          trigger={(
            <Button type="button" className={s.servicesButton}>
              <span className={s.servicesLabel}>Блокировать</span>
              {availableActionsCount > 0 && (
                <span className={s.servicesBadge} aria-hidden="true">
                  {badgeLabel}
                </span>
              )}
            </Button>
          )}
        />
      </div>

      <div className={s.toastStack}>
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={dismissToast} />
        ))}
      </div>
    </div>
  );
}
