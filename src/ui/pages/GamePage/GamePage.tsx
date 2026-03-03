import { GAME_BALANCE } from '@/engine/config';
import { useEffect } from 'react';
import { selectGame, useGameStore } from '@/app/state';
import { readyYandexSdk } from '@/infra/yandex';
import { Text } from '@/ui/shared/Text';
import { ServicesTrigger } from '../../features/ServicesTrigger';
import { BottomBar } from '../../widgets/BottomBar';
import { EndScreen } from '../../widgets/EndScreen';
import { EventBanner } from '../../widgets/EventBanner';
import { MainActionButton } from '../../widgets/MainActionButton';
import { TopBar } from '../../widgets/TopBar';
import s from './GamePage.module.scss';

export function GamePage() {
  const game = useGameStore(selectGame);

  useEffect(() => {
    useGameStore.getState().hydrate();
    void readyYandexSdk();

    const intervalId = window.setInterval(() => {
      useGameStore.getState().tick();
    }, 250);

    const autosaveIntervalId = window.setInterval(() => {
      useGameStore.getState().save();
    }, GAME_BALANCE.autosaveIntervalMs);

    const handlePageHide = () => {
      useGameStore.getState().save();
    };

    window.addEventListener("beforeunload", handlePageHide);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.clearInterval(intervalId);
      window.clearInterval(autosaveIntervalId);
      window.removeEventListener("beforeunload", handlePageHide);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, []);

  if (game.isFinished) {
    return (
      <div className={s.gamePage}>
        <EndScreen />
      </div>
    );
  }

  return (
    <div className={s.gamePage}>
      <TopBar />
      <Text align='center' as="div">
        Начни с кликов, чтобы накопить очки блокировки и открыть первые покупки.
      </Text>
      <EventBanner />
      <MainActionButton />
      <ServicesTrigger />
      <BottomBar />
    </div>
  );
}
