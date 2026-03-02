import { useEffect } from 'react';
import { useGameStore } from '@/app/state';
import { Text } from '@/ui/shared/Text';
import { ServicesTrigger } from '../../features/ServicesTrigger';
import { EventBanner } from '../../widgets/EventBanner';
import { MainActionButton } from '../../widgets/MainActionButton';
import { TopBar } from '../../widgets/TopBar';
import s from './GamePage.module.scss';

export function GamePage() {
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      useGameStore.getState().tick();
    }, 250);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <div className={s.gamePage}>
      <TopBar />
      <Text align='center' as="div">
        Начни с кликов, чтобы накопить очки блокировки и открыть первые покупки.
      </Text>
      <EventBanner />
      <MainActionButton />
      <ServicesTrigger />
    </div>
  );
}
