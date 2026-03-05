import { useEffect, useState, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  getMaxGoal,
  getServiceCards,
  selectEffectsVolume,
  selectGame,
  selectSoundEnabled,
  useGameStore,
} from '@/app/state';
import { GAME_BALANCE } from '@/engine/config';
import type { ServiceTier } from '@/engine/types';
import { Button } from '../../shared/Button';
import { ServiceCard } from '../../entities/ServiceCard';
import { ServiceTierSection } from '../ServiceTierSection';
import { Text } from '../../shared/Text';
import { playUiSound } from '../../shared/sound/playUiSound';
import { uiSounds } from '../../shared/sound/uiSounds';
import styles from './ServicesTrigger.module.scss';

type ServicesTriggerProps = {
  trigger: ReactNode;
  onOpenChange?: (open: boolean) => void;
};

export function ServicesTrigger({ trigger, onOpenChange }: ServicesTriggerProps) {
  const game = useGameStore(selectGame);
  const soundEnabled = useGameStore(selectSoundEnabled);
  const effectsVolume = useGameStore(selectEffectsVolume);
  const buySlow = useGameStore((state) => state.buySlow);
  const buyBan = useGameStore((state) => state.buyBan);
  const buyMax = useGameStore((state) => state.buyMax);
  const services = getServiceCards(game);
  const tiers = [...new Set(services.map((service) => service.tier))];
  const [activeTier, setActiveTier] = useState<ServiceTier>(tiers[0] ?? 1);
  const [open, setOpen] = useState(false);
  const maxGoal = getMaxGoal(game);

  useEffect(() => {
    if (!tiers.includes(activeTier)) {
      setActiveTier(tiers[0] ?? 1);
    }
  }, [activeTier, tiers]);

  const activeTierServices = services.filter((service) => service.tier === activeTier);
  const activePanelId = `services-tier-panel-${activeTier}`;

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  const handleBuySlow = (serviceId: string) => {
    const previousState = useGameStore.getState().game.serviceProgresses[serviceId];

    buySlow(serviceId);

    const nextState = useGameStore.getState().game.serviceProgresses[serviceId];
    if (previousState !== 'slowed' && nextState === 'slowed') {
      playUiSound(uiSounds.slow, {
        enabled: soundEnabled,
        volume: 0.36 * effectsVolume,
      });
    }
  };

  const handleBuyBan = (serviceId: string) => {
    const previousState = useGameStore.getState().game.serviceProgresses[serviceId];

    buyBan(serviceId);

    const nextState = useGameStore.getState().game.serviceProgresses[serviceId];
    if (previousState !== 'banned' && nextState === 'banned') {
      playUiSound(uiSounds.ban, {
        enabled: soundEnabled,
        volume: 0.4 * effectsVolume,
      });
    }
  };

  const handleBuyMax = () => {
    const wasFinished = useGameStore.getState().game.isFinished;

    buyMax();

    const isFinished = useGameStore.getState().game.isFinished;
    if (!wasFinished && isFinished) {
      playUiSound(uiSounds.final, {
        enabled: soundEnabled,
        volume: 0.42 * effectsVolume,
      });
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.modal}>
          <header className={styles.modalHeader}>
            <Dialog.Title asChild>
              <Text as="h2" weight={700} className={styles.title}>
                Сервисы
              </Text>
            </Dialog.Title>

            <Dialog.Close asChild>
              <button type="button" className={styles.closeButton} aria-label="Закрыть список сервисов">
                <svg
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" />
                </svg>
              </button>
            </Dialog.Close>
          </header>

          <Dialog.Description asChild>
            <Text variant="body-sm" tone="secondary">
              Выбери сервис, чтобы замедлить его или заблокировать.
            </Text>
          </Dialog.Description>

          <section className={styles.root}>
            <div className={styles.tabList} role="tablist" aria-label="Тиры сервисов">
              {tiers.map((tier) => {
                const isActive = tier === activeTier;

                return (
                  <button
                    key={tier}
                    type="button"
                    id={`services-tier-tab-${tier}`}
                    role="tab"
                    className={styles.tab}
                    data-active={isActive}
                    aria-selected={isActive}
                    aria-controls={`services-tier-panel-${tier}`}
                    onClick={() => setActiveTier(tier)}
                  >
                    Тир {tier}
                  </button>
                );
              })}
            </div>

            <div
              id={activePanelId}
              role="tabpanel"
              aria-labelledby={`services-tier-tab-${activeTier}`}
              className={styles.tabPanel}
            >
              <ServiceTierSection tier={activeTier}>
                {activeTierServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    name={service.name}
                    description={service.description}
                    isBanned={service.state === "banned"}
                    slowCost={service.slowCost}
                    slowEffect={service.slowEffect}
                    banCost={service.banCost}
                    banMultiplier={service.banMultiplier}
                    slowLabel={service.slowButton.label}
                    slowDisabled={service.slowButton.disabled}
                    banLabel={service.banButton.label}
                    banDisabled={service.banButton.disabled}
                    onBuySlow={() => handleBuySlow(service.id)}
                    onBuyBan={() => handleBuyBan(service.id)}
                  />
                ))}
              </ServiceTierSection>
            </div>

            {maxGoal.unlocked && !maxGoal.isFinished && (
              <section className={styles.maxGoal}>
                <Text as="h2" weight={700}>
                  Финальная цель: MAX
                </Text>
                <Text variant="body-sm">
                  Разблокировано при 100% народного недовольства.
                </Text>
                <Text variant="body-sm">
                  Цена финальной блокировки: {GAME_BALANCE.maxBanCost}
                </Text>
                <Button
                  type="button"
                  onClick={handleBuyMax}
                  disabled={maxGoal.disabled}
                  aria-label="Заблокировать MAX"
                >
                  Заблокировать MAX
                </Button>
              </section>
            )}
          </section>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}




