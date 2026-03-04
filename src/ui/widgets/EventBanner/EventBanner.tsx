import type { CSSProperties } from 'react';
import { getEventBanner, selectGame, useGameStore } from '@/app/state';
import { Tooltip } from '@/ui/shared/Tooltip';
import { Text } from '@/ui/shared/Text';
import styles from './EventBanner.module.scss';

export function EventBanner() {
  const game = useGameStore(selectGame);
  const eventBanner = getEventBanner(game);

  if (!eventBanner) {
    return null;
  }

  const remainingSeconds = Math.ceil(eventBanner.remainingMs / 1000);
  const progress = Math.max(0, Math.min(1, eventBanner.remainingMs / eventBanner.durationMs));
  const meltStyle = {
    transform: `scaleX(${progress})`,
  } as CSSProperties;

  return (
    <Tooltip content="Активное временное событие. Оно даёт временные бафы или дебафы, пока не закончится таймер." side="bottom">
      <section className={styles.root} aria-label="Активное событие">
        <div className={styles.melt} style={meltStyle} aria-hidden="true" />

        <div className={styles.header}>
          <Text as="h2" variant="caption" weight={700} className={styles.title}>
            {eventBanner.name}
          </Text>
          <Text variant="body-sm" className={styles.timer}>
            {`Осталось: ${remainingSeconds} сек.`}
          </Text>
        </div>

        <div className={styles.effects} aria-label="Эффекты события">
          {eventBanner.effects.map((effect) => (
            <span key={effect.label} className={styles.effect} data-tone={effect.tone}>
              {effect.label}
            </span>
          ))}
        </div>
      </section>
    </Tooltip>
  );
}
