import type { ReactNode } from "react";
import { Text } from "../../shared/Text";
import styles from "./ServiceTierSection.module.scss";

type ServiceTierSectionProps = {
  tier: number;
  children: ReactNode;
};

export function ServiceTierSection({ tier, children }: ServiceTierSectionProps) {
  return (
    <section className={styles.root}>
      <Text as="h2" variant="label" weight={700}>
        Тир {tier}
      </Text>
      <div className={styles.list}>
        {children}
      </div>
    </section>
  );
}
