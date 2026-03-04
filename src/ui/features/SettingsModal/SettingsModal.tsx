import type { ReactNode } from 'react';
import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { initYandexSdk } from '@/infra/yandex';
import { selectSoundEnabled, selectSoundVolume, useGameStore } from '@/app/state';
import { Button } from '../../shared/Button';
import { Switch } from '../../shared/Switch';
import { Text } from '../../shared/Text';
import styles from './SettingsModal.module.scss';

type SettingsModalProps = {
  trigger: ReactNode;
  onOpenChange?: (open: boolean) => void;
};

type BonusEventType = 'slow' | 'ban';

const BONUS_EVENT_LABELS: Record<BonusEventType, string> = {
  slow: 'Паника в сети',
  ban: 'Режим ручной блокировки',
};

export function SettingsModal({ trigger, onOpenChange }: SettingsModalProps) {
  const [open, setOpen] = useState(false);
  const [bonusInFlight, setBonusInFlight] = useState<BonusEventType | null>(null);
  const soundEnabled = useGameStore(selectSoundEnabled);
  const soundVolume = useGameStore(selectSoundVolume);
  const toggleSound = useGameStore((state) => state.toggleSound);
  const setSoundVolume = useGameStore((state) => state.setSoundVolume);
  const saveManually = useGameStore((state) => state.saveManually);
  const reset = useGameStore((state) => state.reset);
  const showToast = useGameStore((state) => state.showToast);
  const triggerInstantEvent = useGameStore((state) => state.triggerInstantEvent);
  const volumePercent = Math.round(soundVolume * 100);

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

  const handleBonusEvent = async (eventType: BonusEventType) => {
    if (bonusInFlight) {
      return;
    }

    setBonusInFlight(eventType);

    try {
      const sdk = await initYandexSdk();
      const rewarded = await sdk.showRewardedAd();

      if (!rewarded.ok) {
        showToast(`Бонусное событие не запущено: ${rewarded.message}`, 'error');
        return;
      }

      triggerInstantEvent(eventType);
      showToast(`Бонус получен: ${BONUS_EVENT_LABELS[eventType]}.`, 'success');
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
                  Громкость
                </Text>
                <Text tone="secondary">{volumePercent}%</Text>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={volumePercent}
                className={styles.volumeSlider}
                aria-label="Громкость звука"
                onChange={(event) => setSoundVolume(Number(event.currentTarget.value) / 100)}
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
              Посмотри рекламу и запусти временный эффект сразу, без ожидания обычного триггера.
            </Text>
            <div className={styles.utilityActions}>
              <Button
                type="button"
                variant="secondary"
                disabled={bonusInFlight !== null}
                onClick={() => void handleBonusEvent('slow')}
              >
                {bonusInFlight === 'slow' ? 'Ждем награду...' : 'Паника в сети'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={bonusInFlight !== null}
                onClick={() => void handleBonusEvent('ban')}
              >
                {bonusInFlight === 'ban' ? 'Ждем награду...' : 'Режим ручной блокировки'}
              </Button>
            </div>
          </section>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
