"use client";

import {
  cloneElement,
  type CSSProperties,
  type FocusEvent,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useTooltipPosition, type TooltipSide } from "./useTooltipPosition";
import styles from "./Tooltip.module.css";

export type { TooltipSide };

type TooltipChildProps = {
  "aria-describedby"?: string;
};

const PORTALED_THEME_VARIABLES = [
  "--color-accent",
  "--color-base",
  "--color-text",
] as const;

interface TooltipProps {
  children: ReactElement<TooltipChildProps>;
  className?: string;
  describeChild?: boolean;
  id?: string;
  side?: TooltipSide;
  text: ReactNode;
}

function mergeDescribedBy(currentId: string | undefined, tooltipId: string) {
  return [currentId, tooltipId].filter(Boolean).join(" ");
}

function isFocusVisible(event: FocusEvent<HTMLSpanElement>) {
  return (
    event.target instanceof HTMLElement &&
    event.target.matches(":focus-visible")
  );
}

function getPortaledThemeStyle(element: HTMLElement | null) {
  const themeStyle = {} as CSSProperties & Record<string, string>;

  if (!element) return themeStyle;

  const computedStyle = getComputedStyle(element);

  for (const variable of PORTALED_THEME_VARIABLES) {
    const value = computedStyle.getPropertyValue(variable).trim();

    if (value) {
      themeStyle[variable] = value;
    }
  }

  return themeStyle;
}

export function Tooltip({
  children,
  className = "",
  describeChild = true,
  id,
  side = "bottom",
  text,
}: TooltipProps) {
  const generatedId = useId();
  const tooltipId = id ?? generatedId;
  const wrapperClasses = [styles.wrapper, className].filter(Boolean).join(" ");
  const suppressNextFocusTooltipRef = useRef(false);
  const [portaledThemeStyle, setPortaledThemeStyle] = useState<CSSProperties>(
    {},
  );
  const {
    hideTooltip,
    isActive,
    position,
    showTooltip,
    tooltipRef,
    wrapperRef,
  } = useTooltipPosition(side);
  const tooltipStyle = {
    ...portaledThemeStyle,
    "--tooltip-left": `${position?.left ?? 0}px`,
    "--tooltip-top": `${position?.top ?? 0}px`,
  } as CSSProperties;

  const showThemedTooltip = () => {
    // Portaling avoids clipping, but it leaves local CSS variable scopes.
    // Snapshot the trigger theme so group accent colors follow the tooltip.
    setPortaledThemeStyle(getPortaledThemeStyle(wrapperRef.current));
    showTooltip();
  };

  const handleBlur = () => {
    suppressNextFocusTooltipRef.current = false;
    hideTooltip();
  };

  const handleFocus = (event: FocusEvent<HTMLSpanElement>) => {
    if (suppressNextFocusTooltipRef.current) {
      suppressNextFocusTooltipRef.current = false;
      return;
    }

    if (isFocusVisible(event)) {
      showThemedTooltip();
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLSpanElement>) => {
    // Touch taps can trigger focus before click; keep visual tooltips to mouse
    // hover and keyboard-visible focus so mobile taps do not flash a bubble.
    suppressNextFocusTooltipRef.current = event.pointerType !== "mouse";

    if (suppressNextFocusTooltipRef.current) {
      hideTooltip();
    }
  };

  const handlePointerEnter = (event: PointerEvent<HTMLSpanElement>) => {
    if (event.pointerType === "mouse") {
      showThemedTooltip();
    }
  };

  return (
    <span
      ref={wrapperRef}
      className={wrapperClasses}
      data-side={side}
      onBlurCapture={handleBlur}
      onFocusCapture={handleFocus}
      onPointerDownCapture={handlePointerDown}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={hideTooltip}
    >
      {describeChild
        ? cloneElement(children, {
            "aria-describedby": mergeDescribedBy(
              children.props["aria-describedby"],
              tooltipId,
            ),
          })
        : children}
      {isActive && typeof document !== "undefined"
        ? createPortal(
            <span
              ref={tooltipRef}
              id={tooltipId}
              className={styles.tooltip}
              data-side={position?.side ?? side}
              data-ready={position ? true : undefined}
              role="tooltip"
              style={tooltipStyle}
            >
              {text}
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}
