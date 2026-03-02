import { useGameStore } from "@/app/state";
import { Button } from "@/ui/shared/Button";
import { Text } from "@/ui/shared/Text";
import styles from "./MainActionButton.module.scss";

export function MainActionButton() {
  const click = useGameStore((state) => state.click);

  return (
    <section className={styles.root}>
      <Button type="button" onClick={click} className={styles.button}>
        <Text as="span" weight={700}>
          Блокировать
        </Text>
      </Button>
    </section>
  );
}
