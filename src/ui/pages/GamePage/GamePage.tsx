import { GAME_BALANCE } from '@/engine/config';
import { useEffect, useRef } from 'react';
import { getMaxGoal, getServiceCards, selectGame, selectToasts, useGameStore } from '@/app/state';
import { initYandexSdk, readyYandexSdk, type YandexSdkAdapter } from '@/infra/yandex';
import { Button } from '@/ui/shared/Button';
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

export function GamePage() {
  const game = useGameStore(selectGame);
  const toasts = useGameStore(selectToasts);
  const dismissToast = useGameStore((state) => state.dismissToast);
  const showToast = useGameStore((state) => state.showToast);
  const availableActions = getAvailableActions(game);
  const previousAvailableKeysRef = useRef<string[] | null>(null);
  const availabilityToastsReadyRef = useRef(false);
  const yandexSdkRef = useRef<YandexSdkAdapter | null>(null);
  const tickIntervalIdRef = useRef<number | null>(null);
  const gameplayStopReasonsRef = useRef(new Set<string>());
  const isGameplayRunningRef = useRef(false);
  const isFinishedRef = useRef(game.isFinished);
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
    isFinishedRef.current = game.isFinished;
    syncGameplayState();
  }, [game.isFinished]);

  useEffect(() => {
    useGameStore.getState().hydrate();
    previousAvailableKeysRef.current = getAvailableActions(useGameStore.getState().game).map((action) => action.key);
    availabilityToastsReadyRef.current = true;

    const autosaveIntervalId = window.setInterval(() => {
      useGameStore.getState().save();
    }, GAME_BALANCE.autosaveIntervalMs);

    const handlePageHide = () => {
      useGameStore.getState().save();
    };

    const handleVisibilityChange = () => {
      setGameplayStopped('document-hidden', document.hidden);
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

    return () => {
      isDisposed = true;
      clearTickLoop();
      window.clearInterval(autosaveIntervalId);
      window.removeEventListener('beforeunload', handlePageHide);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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
