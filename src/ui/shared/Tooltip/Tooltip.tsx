import { cloneElement, isValidElement, useMemo, useState, type MouseEvent, type ReactElement } from 'react';
import * as RadixTooltip from '@radix-ui/react-tooltip';
import styles from './Tooltip.module.scss';

type TooltipSide = 'top' | 'right' | 'bottom' | 'left';

type TooltipTriggerProps = {
  onClick?: (event: MouseEvent<HTMLElement>) => void;
};

type TooltipProps = {
  children: ReactElement<TooltipTriggerProps>;
  content: string;
  side?: TooltipSide;
};

function isTouchMode(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia('(hover: none), (pointer: coarse)').matches;
}

export function Tooltip({ children, content, side = 'top' }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const isTouch = useMemo(() => isTouchMode(), []);

  if (!isValidElement<TooltipTriggerProps>(children)) {
    return children;
  }

  const originalOnClick = children.props.onClick;
  const trigger = cloneElement(children, {
    onClick: (event: MouseEvent<HTMLElement>) => {
      originalOnClick?.(event);

      if (isTouch) {
        setOpen((current) => !current);
      }
    },
  });

  return (
    <RadixTooltip.Provider delayDuration={120} skipDelayDuration={0}>
      <RadixTooltip.Root open={open} onOpenChange={setOpen}>
        <RadixTooltip.Trigger asChild>{trigger}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            className={styles.content}
            side={side}
            sideOffset={10}
            collisionPadding={12}
            onPointerDownOutside={() => setOpen(false)}
          >
            {content}
            <RadixTooltip.Arrow className={styles.arrow} width={10} height={6} />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}
