import { getServiceCards, selectGame, useGameStore } from "@/app/state";
import { ServiceCard } from "../../entities/ServiceCard";
import { ServiceTierSection } from "../ServiceTierSection";
import { Text } from "../../shared/Text";
import styles from "./ServicesTrigger.module.scss";

export function ServicesTrigger() {
  const game = useGameStore(selectGame);
  const buySlow = useGameStore((state) => state.buySlow);
  const buyBan = useGameStore((state) => state.buyBan);
  const services = getServiceCards(game);

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
    </section>
  );
}
