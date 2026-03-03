import type { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { selectSoundEnabled, useGameStore } from "@/app/state";
import { Button } from "../../shared/Button";
import { Text } from "../../shared/Text";
import styles from "./SettingsModal.module.scss";

type SettingsModalProps = {
  trigger: ReactNode;
};

export function SettingsModal({ trigger }: SettingsModalProps) {
  const soundEnabled = useGameStore(selectSoundEnabled);
  const toggleSound = useGameStore((state) => state.toggleSound);

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        {trigger}
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />

        <Dialog.Content className={styles.content}>
          <header className={styles.header}>
            <Dialog.Title asChild>
              <Text as="h2" variant="label" weight={700}>
                Настройки
              </Text>
            </Dialog.Title>

            <Dialog.Close asChild>
              <Button variant="ghost" aria-label="Закрыть настройки">
                Закрыть
              </Button>
            </Dialog.Close>
          </header>

          <Dialog.Description asChild>
            <Text tone="secondary">
              Здесь будут игровые настройки. Пока закладываем рабочий каркас окна,
              а поведение подключим вместе со state.
            </Text>
          </Dialog.Description>

          <section className={styles.section}>
            <div className={styles.settingRow}>
              <div className={styles.settingCopy}>
                <Text as="h3" variant="label" weight={600}>
                  Звук
                </Text>
                <Text tone="secondary">
                  {soundEnabled ? "Звуковые эффекты включены." : "Звуковые эффекты отключены."}
                </Text>
              </div>

              <Button
                type="button"
                variant={soundEnabled ? "secondary" : "ghost"}
                aria-pressed={soundEnabled}
                onClick={toggleSound}
              >
                {soundEnabled ? "Вкл" : "Выкл"}
              </Button>
            </div>
          </section>

          <section className={styles.section}>
            <Text as="h3" variant="label" weight={600}>
              Сброс прогресса
            </Text>
            <Text tone="secondary">
              Подтверждение сброса тоже будет подключено отдельно.
            </Text>
          </section>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
