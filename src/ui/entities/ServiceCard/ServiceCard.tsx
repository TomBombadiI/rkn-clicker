import { formatCompactNumber } from "../../shared/format/formatCompactNumber";
import { Button } from "../../shared/Button";
import { Text } from "../../shared/Text";
import styles from "./ServiceCard.module.scss";

type ServiceCardProps = {
  name: string;
  stateLabel: string;
  slowCost: number;
  slowEffect: number;
  banCost: number;
  banMultiplier: number;
  slowLabel: string;
  slowDisabled: boolean;
  banLabel: string;
  banDisabled: boolean;
  onBuySlow: () => void;
  onBuyBan: () => void;
};

export function ServiceCard({
  name,
  stateLabel,
  slowCost,
  slowEffect,
  banCost,
  banMultiplier,
  slowLabel,
  slowDisabled,
  banLabel,
  banDisabled,
  onBuySlow,
  onBuyBan,
}: ServiceCardProps) {
  return (
    <article className={styles.root}>
      <div className={styles.header}>
        <Text as="h3" weight={700}>
          {name}
        </Text>
        <Text variant="body-sm" tone="secondary">
          Статус: {stateLabel}
        </Text>
      </div>

      <div className={styles.actions}>
        <div className={styles.actionBlock}>
          <Text variant="body-sm">Замедление: +{formatCompactNumber(slowEffect)}/сек</Text>
          <Text variant="caption" tone="secondary">
            Цена: {formatCompactNumber(slowCost)}
          </Text>
          <Button
            type="button"
            onClick={onBuySlow}
            disabled={slowDisabled}
            aria-label={`Замедлить ${name}`}
          >
            {slowLabel}
          </Button>
        </div>

        <div className={styles.actionBlock}>
          <Text variant="body-sm">Блокировка: x{formatCompactNumber(banMultiplier)}</Text>
          <Text variant="caption" tone="secondary">
            Цена: {formatCompactNumber(banCost)}
          </Text>
          <Button
            type="button"
            onClick={onBuyBan}
            disabled={banDisabled}
            aria-label={`Заблокировать ${name}`}
          >
            {banLabel}
          </Button>
        </div>
      </div>
    </article>
  );
}
