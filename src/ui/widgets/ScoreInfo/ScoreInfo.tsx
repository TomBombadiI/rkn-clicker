import { selectPassiveIncome, selectScore, useGameStore } from '@/app/state';
import { Tooltip } from '@/ui/shared/Tooltip';
import { formatCompactNumber } from '@/ui/shared/format/formatCompactNumber';
import { Text } from '@/ui/shared/Text';
import styles from './ScoreInfo.module.scss';

export function ScoreInfo() {
  const score = useGameStore(selectScore);
  const passiveIncome = useGameStore(selectPassiveIncome);

  return (
    <Tooltip content="Текущие очки блокировки. Зеленое значение показывает пассивный прирост в секунду." side="bottom">
      <section className={styles.root} aria-label="Очки блокировки">
        <Text as="span" weight={700} className={styles.emoji} aria-hidden="true">
          💠
        </Text>
        <div className={styles.values}>
          <Text as="span" weight={700} className={styles.value} aria-label="Текущее количество очков">
            {formatCompactNumber(score)}
          </Text>
          <Text as="span" weight={700} className={styles.passiveIncome} aria-label="Пассивный доход в секунду">
            (+{formatCompactNumber(passiveIncome)})
          </Text>
        </div>
      </section>
    </Tooltip>
  );
}
