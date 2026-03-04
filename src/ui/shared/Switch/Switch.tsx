import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";
import styles from "./Switch.module.scss";

type SwitchProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "role" | "aria-checked"
> & {
  checked: boolean;
};

export function Switch({ checked, className, type = "button", ...props }: SwitchProps) {
  return (
    <button
      type={type}
      role="switch"
      aria-checked={checked}
      className={clsx(styles.root, className)}
      data-checked={checked}
      {...props}
    >
      <span className={styles.thumb} />
    </button>
  );
}
