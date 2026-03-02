import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.scss";
import clsx from "clsx";

type CommonProps = {
  children: ReactNode,
  className?: string,
  variant?: "primary" | "secondary" | "ghost" | "circle",
};

type ButtonAsButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
    href?: never;
  };

type ButtonAsLinkProps = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children"> & {
    href: string;
  };

export type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;


export function Button(props: ButtonProps) {
  if ("href" in props && typeof props.href === "string") {
    const { 
      href, 
      children, 
      className, 
      variant = "primary", 
      ...anchorProps 
    } = props;
    const classes = clsx(styles.root, styles[variant], className);

    return (
      <a href={href} className={classes} {...anchorProps}>
        {children}
      </a>
    );
  }

  const { 
    type = "button", 
    children, 
    className, 
    variant = "primary", 
    ...buttonProps 
  } = props;
  const classes = clsx(styles.root, styles[variant], className);

  return (
    <button type={type} className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
