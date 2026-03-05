import * as Dialog from "@radix-ui/react-dialog";
import { formatCompactNumber } from "../../shared/format/formatCompactNumber";
import { Button } from "../../shared/Button";
import { Text } from "../../shared/Text";
import { Tooltip } from "../../shared/Tooltip";
import styles from "./ServiceCard.module.scss";

type ServiceCardProps = {
  name: string;
  description: string;
  isBanned: boolean;
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
  description,
  isBanned,
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
    <Dialog.Root>
      <article className={styles.root} data-banned={isBanned}>
        <div className={styles.headerRow}>
          <Tooltip content="Короткая справка о сервисе. По кнопке вопроса откроется полное описание." side="top">
            <div className={styles.header}>
              <Text as="h3" weight={700}>
                {name}
              </Text>
            </div>
          </Tooltip>

          <Dialog.Trigger asChild>
            <button type="button" className={styles.infoButton} aria-label={`Описание ${name}`}>
              ?
            </button>
          </Dialog.Trigger>
        </div>

        <div className={styles.actions}>
          <div className={styles.actionBlock}>
            <Tooltip content="Замедление увеличивает пассивный доход, но не повышает множитель блокировки." side="left">
              <div>
                <Text variant="body-sm">Замедление: +{formatCompactNumber(slowEffect)}/сек</Text>
                <Text as="p" weight={700} className={styles.cost} aria-label={`Цена замедления ${name}`}>
                  💸 {formatCompactNumber(slowCost)}
                </Text>
              </div>
            </Tooltip>
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
            <Tooltip content="Блокировка усиливает клики через множитель и заметно продвигает общий прогресс." side="right">
              <div>
                <Text variant="body-sm">Блокировка: x{formatCompactNumber(banMultiplier)}</Text>
                <Text as="p" weight={700} className={styles.cost} aria-label={`Цена блокировки ${name}`}>
                  💸 {formatCompactNumber(banCost)}
                </Text>
              </div>
            </Tooltip>
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

      <Dialog.Portal>
        <Dialog.Overlay className={styles.descriptionOverlay} />
        <Dialog.Content className={styles.descriptionModal}>
          <header className={styles.descriptionHeader}>
            <Dialog.Title asChild>
              <Text as="h3" weight={700}>
                {name}
              </Text>
            </Dialog.Title>

            <Dialog.Close asChild>
              <button type="button" className={styles.descriptionClose} aria-label={`Закрыть описание ${name}`}>
                <svg
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" />
                </svg>
              </button>
            </Dialog.Close>
          </header>

          <Dialog.Description asChild>
            <Text className={styles.descriptionText}>
              {description}
            </Text>
          </Dialog.Description>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
