import { getMaxGoal, getServiceCards, selectGame, useGameStore } from "@/app/state";
import { GAME_BALANCE } from "@/engine/config";
import { Button } from "../../shared/Button";
import { ServiceCard } from "../../entities/ServiceCard";
import { ServiceTierSection } from "../ServiceTierSection";
import { Text } from "../../shared/Text";
import styles from "./ServicesTrigger.module.scss";

export function ServicesTrigger() {
  const game = useGameStore(selectGame);
  const buySlow = useGameStore((state) => state.buySlow);
  const buyBan = useGameStore((state) => state.buyBan);
  const buyMax = useGameStore((state) => state.buyMax);
  const services = getServiceCards(game);
  const maxGoal = getMaxGoal(game);

  const tiers = [...new Set(services.map((service) => service.tier))];

  return (
    <section className={styles.root}>
      <Text as="h2" weight={700}>
        Сервисы
      </Text>

      {tiers.map((tier) => (
        <ServiceTierSection key={tier} tier={tier}>
          {services
            .filter((service) => service.tier === tier)
            .map((service) => (
              <ServiceCard
                key={service.id}
                name={service.name}
                stateLabel={service.state}
                slowCost={service.slowCost}
                slowEffect={service.slowEffect}
                banCost={service.banCost}
                banMultiplier={service.banMultiplier}
                slowLabel={service.slowButton.label}
                slowDisabled={service.slowButton.disabled}
                banLabel={service.banButton.label}
                banDisabled={service.banButton.disabled}
                onBuySlow={() => buySlow(service.id)}
                onBuyBan={() => buyBan(service.id)}
              />
            ))}
        </ServiceTierSection>
      ))}

      {maxGoal.unlocked && !maxGoal.isFinished && (
        <section className={styles.maxGoal}>
          <Text as="h2" weight={700}>
            Финальная цель: MAX
          </Text>
          <Text variant="body-sm">
            Разблокировано при 100% народного недовольства.
          </Text>
          <Text variant="body-sm">
            Цена финальной блокировки: {GAME_BALANCE.maxBanCost}
          </Text>
          <Button
            type="button"
            onClick={() => buyMax()}
            disabled={maxGoal.disabled}
            aria-label="Заблокировать MAX"
          >
            Заблокировать MAX
          </Button>
        </section>
      )}
    </section>
  );
}
