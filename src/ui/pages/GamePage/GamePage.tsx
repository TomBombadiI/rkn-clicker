import { GAME_BALANCE } from '@/engine/config';
import { useEffect, useRef } from 'react';
import { getMaxGoal, getServiceCards, selectGame, selectToasts, useGameStore } from '@/app/state';
import { readyYandexSdk } from '@/infra/yandex';
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
  const availableActionsCount = availableActions.length;
  const badgeCount = Math.min(availableActionsCount, MAX_BADGE_COUNT);
  const badgeLabel = availableActionsCount > MAX_BADGE_COUNT ? '9+' : String(badgeCount);

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
    useGameStore.getState().hydrate();
    previousAvailableKeysRef.current = getAvailableActions(useGameStore.getState().game).map((action) => action.key);
    availabilityToastsReadyRef.current = true;
    void readyYandexSdk();

    const intervalId = window.setInterval(() => {
      useGameStore.getState().tick();
    }, 250);

    const autosaveIntervalId = window.setInterval(() => {
      useGameStore.getState().save();
    }, GAME_BALANCE.autosaveIntervalMs);

    const handlePageHide = () => {
      useGameStore.getState().save();
    };

    window.addEventListener('beforeunload', handlePageHide);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.clearInterval(intervalId);
      window.clearInterval(autosaveIntervalId);
      window.removeEventListener('beforeunload', handlePageHide);
      window.removeEventListener('pagehide', handlePageHide);
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
        <TopBar />

        <div className={s.eventSlot}>
          <div className={s.eventInner}>
            <EventBanner />
          </div>
        </div>

        <section className={s.mainActionArea}>
          <MainActionButton />
        </section>

        <ServicesTrigger
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
