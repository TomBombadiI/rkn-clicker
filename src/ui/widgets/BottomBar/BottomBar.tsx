import { useGameStore } from "@/app/state";
import { Button } from "@/ui/shared/Button";
import { Text } from "@/ui/shared/Text";
import styles from "./BottomBar.module.scss";

export function BottomBar() {
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
    </section>
  );
}
