import { useEffect } from "react";
import clsx from "clsx";
import type { ToastTone } from "@/app/state";
import styles from "./Toast.module.scss";

type ToastProps = {
  id: number;
  message: string;
  tone: ToastTone;
  onClose: (id: number) => void;
};

const TOAST_DURATION_MS = 2600;

export function Toast({ id, message, tone, onClose }: ToastProps) {
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      onClose(id);
    }, TOAST_DURATION_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [id, onClose]);

  return (
    <section
      className={clsx(styles.root, styles[tone])}
      role={tone === "error" ? "alert" : "status"}
      onClick={() => onClose(id)}
    >
      {message}
    </section>
  );
}
