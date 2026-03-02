import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import styles from "./Text.module.scss";
import clsx from "clsx";

type TextOwnProps = {
  children: ReactNode,
  variant?: "body" | "body-sm" | "caption" | "label",
  tone?: "primary" | "secondary" | "muted" | "danger" | "success",
  weight?: 400 | 500 | 600 | 700,
  align?: "left" | "center" | "right",
  className?: string,
};

type TextProps<T extends ElementType = "p"> = TextOwnProps &
  Omit<ComponentPropsWithoutRef<T>, keyof TextOwnProps | "as"> & {
    as?: T;
  };

const WEIGHT_CLASS_MAP = {
  500: styles["weight-500"],
  600: styles["weight-600"],
  700: styles["weight-700"],
} as const;

const ALIGN_CLASS_MAP = {
  center: styles["align-center"],
  right: styles["align-right"],
} as const;

export function Text<T extends ElementType = "p">(props: TextProps<T>) {
  const {
    as,
    variant = "body",
    tone = "primary",
    weight = 400,
    align = "left",
    className,
    children,
    ...nativeProps
  } = props;
  const TagName = as ?? "p";

  const classes = clsx(
    styles.root,
    variant !== "body" && styles[variant],
    tone !== "primary" && styles[tone],
    weight !== 400 && WEIGHT_CLASS_MAP[weight as 500 | 600 | 700],
    align !== "left" && ALIGN_CLASS_MAP[align as "center" | "right"],
    className,
  );

  return (
    <TagName className={classes} {...nativeProps}>
      {children}
    </TagName>
  );
}
