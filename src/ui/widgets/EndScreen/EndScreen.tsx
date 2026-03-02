import { selectBlockMultiplier, selectDissentPercent, selectGame, useGameStore } from "@/app/state";
import { Button } from "@/ui/shared/Button";
import { Text } from "@/ui/shared/Text";
import styles from "./EndScreen.module.scss";

const NUMBER_FORMATTER = new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 0,
});

export function EndScreen() {
  const game = useGameStore(selectGame);
  const blockMultiplier = useGameStore(selectBlockMultiplier);
  const dissentPercent = useGameStore(selectDissentPercent);
  const reset = useGameStore((state) => state.reset);

  return (
    <section className={styles.root} aria-label="Экран завершения игры">
      <Text as="h1" weight={700}>
        MAX заблокирован
      </Text>
      <Text align="center">
        Игра завершена. Финальная цель достигнута.
      </Text>
      <Text variant="body-sm">Остаток очков: {NUMBER_FORMATTER.format(game.score)}</Text>
      <Text variant="body-sm">Множитель блокировок: x{NUMBER_FORMATTER.format(blockMultiplier)}</Text>
      <Text variant="body-sm">Народное недовольство: {dissentPercent}%</Text>
      <Button type="button" onClick={() => reset()}>
        Новая игра
      </Button>
    </section>
  );
}
