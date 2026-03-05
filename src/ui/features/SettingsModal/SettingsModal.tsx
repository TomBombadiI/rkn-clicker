import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import type { EventTemplate } from '@/engine/types';
import { initYandexSdk } from '@/infra/yandex';
import {
  getRewardEventCards,
  selectEffectsVolume,
  selectMusicVolume,
  selectSoundEnabled,
  useGameStore,
} from '@/app/state';
import { formatCompactNumber } from '@/ui/shared/format/formatCompactNumber';
import { Button } from '../../shared/Button';
import { Switch } from '../../shared/Switch';
import { Text } from '../../shared/Text';
import styles from './SettingsModal.module.scss';

type SettingsModalProps = {
  trigger: ReactNode;
  onOpenChange?: (open: boolean) => void;
};

function formatMultiplier(value: number): string {
  if (Number.isInteger(value)) {
    return value.toString();
  }

  return value.toFixed(2).replace(/\.0+$|0+$/g, '').replace(/\.$/, '');
}

function getEventBonusDescription(event: EventTemplate): string {
  const effects: string[] = [];

  if (event.instantScoreBase && event.instantScoreBase > 0) {
    effects.push(`Разовый бонус: +${formatCompactNumber(event.instantScoreBase)} очков x текущий множитель блокировок.`);
  }

  if (event.durationMs > 0) {
    const timedEffects: string[] = [];

    if (event.multipliers.clickMultiplier !== 1) {
      timedEffects.push(`клик x${formatMultiplier(event.multipliers.clickMultiplier)}`);
    }

    if (event.multipliers.passiveMultiplier !== 1) {
      timedEffects.push(`пассив x${formatMultiplier(event.multipliers.passiveMultiplier)}`);
    }

    if (timedEffects.length > 0) {
      effects.push(`На ${Math.round(event.durationMs / 1000)} сек: ${timedEffects.join(', ')}.`);
    }
  }

  if (effects.length === 0) {
    return 'Бонус без изменения дохода.';
  }

  return effects.join(' ');
}

export function SettingsModal({ trigger, onOpenChange }: SettingsModalProps) {
  const [open, setOpen] = useState(false);
  const [bonusInFlight, setBonusInFlight] = useState<string | null>(null);
  const soundEnabled = useGameStore(selectSoundEnabled);
  const effectsVolume = useGameStore(selectEffectsVolume);
  const musicVolume = useGameStore(selectMusicVolume);
  const toggleSound = useGameStore((state) => state.toggleSound);
  const setEffectsVolume = useGameStore((state) => state.setEffectsVolume);
  const setMusicVolume = useGameStore((state) => state.setMusicVolume);
  const saveManually = useGameStore((state) => state.saveManually);
  const reset = useGameStore((state) => state.reset);
  const showToast = useGameStore((state) => state.showToast);
  const triggerInstantEvent = useGameStore((state) => state.triggerInstantEvent);
  const rewardEvents = getRewardEventCards();
  const effectsPercent = Math.round(effectsVolume * 100);
  const musicPercent = Math.round(musicVolume * 100);

  const rewardEventsWithDescription = useMemo(
    () => rewardEvents.map((event) => ({ ...event, description: getEventBonusDescription(event) })),
    [rewardEvents],
  );

  const handleModalOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  const handleReset = () => {
    if (!window.confirm('Сбросить текущий прогресс?')) {
      return;
    }

    reset();
  };

  const handleSave = () => {
    saveManually();
    handleModalOpenChange(false);
  };

  const handleBonusEvent = async (event: EventTemplate) => {
    if (bonusInFlight) {
      return;
    }

    setBonusInFlight(event.id);

    try {
      const sdk = await initYandexSdk();
      const rewarded = await sdk.showRewardedAd();

      if (!rewarded.ok) {
        showToast(`Бонусное событие не запущено: ${rewarded.message}`, 'error');
        return;
      }

      triggerInstantEvent(event.id);
      showToast(`Бонус получен: ${event.name}.`, 'success');
      handleModalOpenChange(false);
    } finally {
      setBonusInFlight(null);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleModalOpenChange}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />

        <Dialog.Content className={styles.content}>
          <header className={styles.header}>
            <Dialog.Title asChild>
              <Text as="h2" variant="label" weight={700} className={styles.title}>
                Настройки
              </Text>
            </Dialog.Title>

            <Dialog.Close asChild>
              <button type="button" className={styles.closeButton} aria-label="Закрыть настройки">
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
            <Text tone="secondary">Быстрые игровые настройки и управление прогрессом.</Text>
          </Dialog.Description>

          <section className={styles.section}>
            <div className={styles.settingRow}>
              <div className={styles.settingCopy}>
                <Text as="h3" variant="label" weight={600}>
                  Звук
                </Text>
                <Text tone="secondary">
                  {soundEnabled ? 'Звуковые эффекты включены.' : 'Звуковые эффекты отключены.'}
                </Text>
              </div>

              <Switch checked={soundEnabled} aria-label="Переключить звук" onClick={toggleSound} />
            </div>

            <div className={styles.volumeBlock}>
              <div className={styles.volumeHeader}>
                <Text as="h3" variant="label" weight={600}>
                  Звуковые эффекты
                </Text>
                <Text tone="secondary">{effectsPercent}%</Text>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={effectsPercent}
                className={styles.volumeSlider}
                aria-label="Громкость звуковых эффектов"
                onChange={(event) => setEffectsVolume(Number(event.currentTarget.value) / 100)}
              />
            </div>

            <div className={styles.volumeBlock}>
              <div className={styles.volumeHeader}>
                <Text as="h3" variant="label" weight={600}>
                  Музыка
                </Text>
                <Text tone="secondary">{musicPercent}%</Text>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={musicPercent}
                className={styles.volumeSlider}
                aria-label="Громкость музыки"
                onChange={(event) => setMusicVolume(Number(event.currentTarget.value) / 100)}
              />
            </div>
          </section>

          <section className={styles.section}>
            <Text as="h3" variant="label" weight={600}>
              Прогресс
            </Text>
            <div className={styles.utilityActions}>
              <Button type="button" variant="secondary" onClick={handleSave}>
                Сохранить
              </Button>
              <Button type="button" variant="ghost" onClick={handleReset}>
                Сбросить
              </Button>
            </div>
          </section>

          <section className={styles.section}>
            <Text as="h3" variant="label" weight={600}>
              Бонусные события
            </Text>
            <Text tone="secondary" className={styles.sectionHint}>
              Показаны эффекты бонусов. Нажатие сразу запускает rewarded-рекламу.
            </Text>
            <div className={styles.bonusList}>
              {rewardEventsWithDescription.map((event) => (
                <article key={event.id} className={styles.bonusCard}>
                  <div className={styles.bonusMeta}>
                    <Text as="h4" variant="label" weight={600}>{event.name}</Text>
                    <Text tone="secondary">{event.description}</Text>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={bonusInFlight !== null}
                    onClick={() => void handleBonusEvent(event)}
                  >
                    {bonusInFlight === event.id ? 'Ждем награду...' : 'Получить бонус'}
                  </Button>
                </article>
              ))}
            </div>
          </section>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
