import { SettingsModal } from '../../features/SettingsModal';
import { Button } from '../../shared/Button';
import { Icon } from '../../shared/Icon';
import { GameProgress } from '../GameProgress';
import { ScoreInfo } from '../ScoreInfo';
import styles from './TopBar.module.scss';

export function TopBar() {
  return (
    <section className={styles.root}>
      <ScoreInfo />
      <GameProgress />
      <div className={styles.settingsSlot}>
        <SettingsModal
          trigger={(
            <Button type="button" variant="circle" aria-label="Открыть настройки">
              <Icon name="settings" decorative={false} title="Открыть настройки" />
            </Button>
          )}
        />
      </div>
    </section>
  );
}
