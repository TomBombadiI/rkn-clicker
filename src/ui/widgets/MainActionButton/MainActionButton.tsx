import { useRef, useState } from 'react';
import rknLogo from '@/assets/rkn-logo.svg';
import { selectEffectsVolume, selectSoundEnabled, useGameStore } from '@/app/state';
import { formatCompactNumber } from '@/ui/shared/format/formatCompactNumber';
import { Button } from '@/ui/shared/Button';
import { playUiSound } from '@/ui/shared/sound/playUiSound';
import { uiSounds } from '@/ui/shared/sound/uiSounds';
import styles from './MainActionButton.module.scss';

type ClickFeedback = {
  id: number;
  amount: number;
  lane: number;
};

const FEEDBACK_LANES = 3;
const MAX_VISIBLE_FEEDBACKS = 6;

export function MainActionButton() {
  const click = useGameStore((state) => state.click);
  const soundEnabled = useGameStore(selectSoundEnabled);
  const effectsVolume = useGameStore(selectEffectsVolume);
  const [feedbacks, setFeedbacks] = useState<ClickFeedback[]>([]);
  const feedbackIdRef = useRef(0);

  const handleClick = () => {
    const now = Date.now();
    const previousScore = useGameStore.getState().game.score;

    click(now);
    playUiSound(uiSounds.click, {
      enabled: soundEnabled,
      volume: 0.35 * effectsVolume,
    });

    const nextScore = useGameStore.getState().game.score;
    const amount = Math.max(0, Math.round(nextScore - previousScore));
    if (amount <= 0) {
      return;
    }

    const nextId = feedbackIdRef.current + 1;
    feedbackIdRef.current = nextId;

    setFeedbacks((current) => {
      const nextFeedback: ClickFeedback = {
        id: nextId,
        amount,
        lane: nextId % FEEDBACK_LANES,
      };

      return [...current, nextFeedback].slice(-MAX_VISIBLE_FEEDBACKS);
    });
  };

  const handleFeedbackEnd = (feedbackId: number) => {
    setFeedbacks((current) => current.filter((feedback) => feedback.id !== feedbackId));
  };

  return (
    <section className={styles.root}>
      <div className={styles.feedbackLayer} aria-hidden="true">
        {feedbacks.map((feedback) => (
          <span
            key={feedback.id}
            className={styles.feedback}
            data-lane={feedback.lane}
            onAnimationEnd={() => handleFeedbackEnd(feedback.id)}
          >
            +{formatCompactNumber(feedback.amount)}
          </span>
        ))}
      </div>

      <Button
        type="button"
        onClick={handleClick}
        className={styles.button}
        aria-label="Набрать очки блокировки"
      >
        <img src={rknLogo} alt="" className={styles.logo} />
      </Button>
    </section>
  );
}
