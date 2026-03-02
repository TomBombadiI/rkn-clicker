import clsx from "clsx";
import styles from "./Icon.module.scss";
import { iconMap, type IconName } from "./iconMap";

type IconProps = {
  name: IconName;
  size?: number;
  className?: string;
} & (
  | {
      decorative?: true;
      title?: never;
    }
  | {
      decorative: false;
      title: string;
    }
);

export function Icon({ name, size = 24, decorative = true, title, className }: IconProps) {
  const IconComponent = iconMap[name];
  const classes = clsx(styles.root, className);

  if (!IconComponent) {
    return null;
  }

  return (
    <IconComponent
      className={classes}
      width={size}
      height={size}
      aria-hidden={decorative ? true : undefined}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : title}
      focusable="false"
    />
  );
}
