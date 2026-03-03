import { selectBlockMultiplier, selectPassiveIncome, selectScore, useGameStore } from "@/app/state";
import { formatCompactNumber } from "@/ui/shared/format/formatCompactNumber";
import { Text } from "@/ui/shared/Text";
import styles from "./ScoreInfo.module.scss";

export function ScoreInfo() {
  const score = useGameStore(selectScore);
  const passiveIncome = useGameStore(selectPassiveIncome);
  const blockMultiplier = useGameStore(selectBlockMultiplier);

  return (
    <section className={styles.root} aria-label="Основные показатели">
      <Text as="p" variant="body-sm" weight={600}>
        Очки блокировки: {formatCompactNumber(score)}
      </Text>
      <Text as="p" variant="body-sm">
        Доход в секунду: {formatCompactNumber(passiveIncome)}
      </Text>
      <Text as="p" variant="body-sm">
        Множитель блокировок: x{formatCompactNumber(blockMultiplier)}
      </Text>
    </section>
  );
}
