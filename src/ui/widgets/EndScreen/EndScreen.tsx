import { selectBlockMultiplier, selectDissentPercent, selectGame, useGameStore } from "@/app/state";
import { formatCompactNumber } from "@/ui/shared/format/formatCompactNumber";
import { Button } from "@/ui/shared/Button";
import { Text } from "@/ui/shared/Text";
import styles from "./EndScreen.module.scss";

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
      <Text variant="body-sm">Остаток очков: {formatCompactNumber(game.score)}</Text>
      <Text variant="body-sm">Множитель блокировок: x{formatCompactNumber(blockMultiplier)}</Text>
      <Text variant="body-sm">Народное недовольство: {dissentPercent}%</Text>
      <Button type="button" onClick={() => reset()}>
        Новая игра
      </Button>
    </section>
  );
}
