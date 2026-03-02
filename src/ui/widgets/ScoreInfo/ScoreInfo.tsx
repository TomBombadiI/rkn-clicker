import { selectBlockMultiplier, selectPassiveIncome, selectScore, useGameStore } from "@/app/state";
import { Text } from "@/ui/shared/Text";
import styles from "./ScoreInfo.module.scss";

const NUMBER_FORMATTER = new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 0,
});

const RATE_FORMATTER = new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 1,
});

export function ScoreInfo() {
  const score = useGameStore(selectScore);
  const passiveIncome = useGameStore(selectPassiveIncome);
  const blockMultiplier = useGameStore(selectBlockMultiplier);

  return (
    <section className={styles.root} aria-label="Основные показатели">
      <Text as="p" variant="body-sm" weight={600}>
        Очки блокировки: {NUMBER_FORMATTER.format(score)}
      </Text>
      <Text as="p" variant="body-sm">
        Доход в секунду: {RATE_FORMATTER.format(passiveIncome)}
      </Text>
      <Text as="p" variant="body-sm">
        Множитель блокировок: x{RATE_FORMATTER.format(blockMultiplier)}
      </Text>
    </section>
  );
}
