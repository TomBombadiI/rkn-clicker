import type { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "../../shared/Button";
import { Text } from "../../shared/Text";
import styles from "./SettingsModal.module.scss";

type SettingsModalProps = {
  trigger: ReactNode;
};

export function SettingsModal({ trigger }: SettingsModalProps) {
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
            <Text as="h3" variant="label" weight={600}>
              Звук
            </Text>
            <Text tone="secondary">Переключатель добавим в следующей итерации.</Text>
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
