import { selectDissentPercent, useGameStore } from '@/app/state';
import { Tooltip } from '@/ui/shared/Tooltip';
import styles from './GameProgress.module.scss';

export function GameProgress() {
  const dissentPercent = useGameStore(selectDissentPercent);

  return (
    <Tooltip content="Народное недовольство. Чем выше шкала, тем ближе особая развязка." side="bottom">
      <section className={styles.root} aria-label="Прогресс недовольства">
        <span className={styles.emoji} aria-hidden="true">
          📡
        </span>
        <progress
          className={styles.bar}
          value={dissentPercent}
          max={100}
          aria-label="Шкала народного недовольства"
        />
      </section>
    </Tooltip>
  );
}

