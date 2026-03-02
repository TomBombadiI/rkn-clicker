import { SettingsModal } from "../../features/SettingsModal";
import { Button } from "../../shared/Button";
import { Icon } from "../../shared/Icon";
import { GameProgress } from "../GameProgress";
import { ScoreInfo } from "../ScoreInfo";
import styles from "./TopBar.module.scss";

export function TopBar() {
  return (
    <section className={styles.root}>
      <ScoreInfo />
      <GameProgress />
      <SettingsModal
        trigger={(
          <Button type="button" variant="circle">
            <Icon name="settings" decorative={false} title="Открыть настройки" />
          </Button>
        )}
      />
    </section>
  );
}
