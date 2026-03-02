import { getEventBanner, selectGame, useGameStore } from "@/app/state";
import { Text } from "@/ui/shared/Text";
import styles from "./EventBanner.module.scss";

export function EventBanner() {
  const game = useGameStore(selectGame);
  const eventBanner = getEventBanner(game);

  if (!eventBanner) {
    return (
      <section className={styles.root}>
        <Text variant="body-sm" tone="secondary">
          Сейчас нет активного события.
        </Text>
      </section>
    );
  }

  const remainingSeconds = Math.ceil(eventBanner.remainingMs / 1000);

  return (
    <section className={styles.root} aria-label="Активное событие">
      <Text as="h2" variant="label" weight={700}>
        {eventBanner.name}
      </Text>
      <Text variant="body-sm">
        {eventBanner.phase === "active"
          ? `Осталось: ${remainingSeconds} сек.`
          : `Запуск через: ${remainingSeconds} сек.`}
      </Text>
    </section>
  );
}
