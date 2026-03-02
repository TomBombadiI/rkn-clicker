import { selectDissentPercent, useGameStore } from "@/app/state";
import { Text } from "@/ui/shared/Text";
import styles from "./GameProgress.module.scss";

export function GameProgress() {
  const dissentPercent = useGameStore(selectDissentPercent);

  return (
    <section className={styles.root} aria-label="Прогресс недовольства">
      <Text as="p" variant="body-sm" weight={600}>
        Народное недовольство: {dissentPercent}%
      </Text>
      <progress
        className={styles.bar}
        value={dissentPercent}
        max={100}
        aria-label="Шкала народного недовольства"
      />
    </section>
  );
}
