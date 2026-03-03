import { selectActionLog, useGameStore } from "@/app/state";
import { Button } from "@/ui/shared/Button";
import { Text } from "@/ui/shared/Text";
import styles from "./BottomBar.module.scss";

export function BottomBar() {
  const actionLog = useGameStore(selectActionLog);
  const save = useGameStore((state) => state.save);
  const reset = useGameStore((state) => state.reset);

  const handleReset = () => {
    if (!window.confirm("Сбросить текущий прогресс?")) {
      return;
    }

    reset();
  };

  return (
    <section className={styles.root} aria-label="Игровое меню">
      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={() => save()}>
          Сохранить
        </Button>
        <Button type="button" variant="ghost" onClick={handleReset}>
          Сбросить прогресс
        </Button>
      </div>

      <Text variant="caption" tone="secondary">
        Прогресс сохраняется автоматически каждые 10 секунд и при покупке.
      </Text>

      <section className={styles.log} aria-label="Последние действия">
        <Text as="h2" variant="label" weight={600}>
          Последние действия
        </Text>

        {actionLog.length === 0 ? (
          <Text variant="caption" tone="secondary">
            История действий появится после первых кликов и покупок.
          </Text>
        ) : (
          <ul className={styles.logList}>
            {actionLog.map((entry, index) => (
              <li key={`${entry.createdAt}-${index}`} className={styles.logItem}>
                <Text variant="caption">{entry.message}</Text>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
