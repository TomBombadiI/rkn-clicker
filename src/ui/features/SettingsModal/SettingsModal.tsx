import type { ReactNode } from 'react';
import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { selectSoundEnabled, useGameStore } from '@/app/state';
import { Button } from '../../shared/Button';
import { Switch } from '../../shared/Switch';
import { Text } from '../../shared/Text';
import styles from './SettingsModal.module.scss';

type SettingsModalProps = {
  trigger: ReactNode;
};

export function SettingsModal({ trigger }: SettingsModalProps) {
  const [open, setOpen] = useState(false);
  const soundEnabled = useGameStore(selectSoundEnabled);
  const toggleSound = useGameStore((state) => state.toggleSound);
  const saveManually = useGameStore((state) => state.saveManually);
  const reset = useGameStore((state) => state.reset);
  const triggerDebugEvent = useGameStore((state) => state.triggerDebugEvent);

  const handleReset = () => {
    if (!window.confirm('Сбросить текущий прогресс?')) {
      return;
    }

    reset();
  };

  const handleSave = () => {
    saveManually();
    setOpen(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
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
              Для разработчика
            </Text>
            <Text tone="secondary" className={styles.sectionHint}>
              Ручной запуск событий для проверки баннера и временных бафов.
            </Text>
            <div className={styles.utilityActions}>
              <Button type="button" variant="secondary" onClick={() => triggerDebugEvent('slow')}>
                Паника в сети
              </Button>
              <Button type="button" variant="secondary" onClick={() => triggerDebugEvent('ban')}>
                Режим ручной блокировки
              </Button>
            </div>
          </section>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
