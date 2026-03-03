import { useEffect, useRef, useState } from "react";
import { useGameStore } from "@/app/state";
import { Button } from "@/ui/shared/Button";
import { Text } from "@/ui/shared/Text";
import styles from "./MainActionButton.module.scss";

type ClickFeedback = {
  id: number;
  amount: number;
};

export function MainActionButton() {
  const click = useGameStore((state) => state.click);
  const [feedbacks, setFeedbacks] = useState<ClickFeedback[]>([]);
  const feedbackIdRef = useRef(0);
  const timeoutIdsRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      timeoutIdsRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
    };
  }, []);

  const handleClick = () => {
    const now = Date.now();
    const previousScore = useGameStore.getState().game.score;

    click(now);

    const nextScore = useGameStore.getState().game.score;
    const amount = Math.max(0, Math.round(nextScore - previousScore));
    if (amount <= 0) {
      return;
    }

    const nextId = feedbackIdRef.current + 1;
    feedbackIdRef.current = nextId;

    setFeedbacks((current) => [
      ...current,
      {
        id: nextId,
        amount,
      },
    ]);

    const timeoutId = window.setTimeout(() => {
      setFeedbacks((current) => current.filter((feedback) => feedback.id !== nextId));
      timeoutIdsRef.current = timeoutIdsRef.current.filter((id) => id !== timeoutId);
    }, 700);

    timeoutIdsRef.current.push(timeoutId);
  };

  return (
    <section className={styles.root}>
      <div className={styles.feedbackLayer} aria-hidden="true">
        {feedbacks.map((feedback) => (
          <span key={feedback.id} className={styles.feedback}>
            +{feedback.amount}
          </span>
        ))}
      </div>

      <Button type="button" onClick={handleClick} className={styles.button}>
        <Text as="span" weight={700}>
          Блокировать
        </Text>
      </Button>
    </section>
  );
}
