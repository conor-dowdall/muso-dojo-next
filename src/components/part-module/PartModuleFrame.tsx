import {
  type CSSProperties,
  type KeyboardEventHandler,
  type PointerEventHandler,
  type ReactNode,
} from "react";
import { type InstrumentNoteEmphasis } from "@/types/instrument-note-emphasis";
import { type InstrumentWidthMode } from "@/types/instrument-layout";
import { ControlHeader } from "@/components/ui/control-header/ControlHeader";
import styles from "./PartModuleFrame.module.css";

const interactiveShortcutTargetSelector = [
  "a[href]",
  "button",
  "input",
  "select",
  "summary",
  "textarea",
  "[contenteditable]",
  '[role="button"]',
  '[role="checkbox"]',
  '[role="combobox"]',
  '[role="link"]',
  '[role="listbox"]',
  '[role="menuitem"]',
  '[role="radio"]',
  '[role="searchbox"]',
  '[role="slider"]',
  '[role="spinbutton"]',
  '[role="switch"]',
  '[role="tab"]',
  '[role="textbox"]',
  '[tabindex]:not([tabindex="-1"])',
].join(",");

interface PartModuleFrameProps {
  bodyClassName?: string;
  children: ReactNode;
  className?: string;
  headerActions?: ReactNode;
  headerActionsGrow?: boolean;
  headerPrimary?: ReactNode;
  noteEmphasis?: InstrumentNoteEmphasis;
  onKeyDownCapture?: KeyboardEventHandler<HTMLDivElement>;
  onPointerDownCapture?: PointerEventHandler<HTMLDivElement>;
  showHeader?: boolean;
  style?: CSSProperties;
  widthMode?: InstrumentWidthMode;
}

function isInteractiveShortcutTarget(target: EventTarget | null) {
  return target instanceof Element
    ? target.closest(interactiveShortcutTargetSelector) !== null
    : false;
}

/**
 * Shared module layout for Part modules. Instruments, Drone, and future modules
 * should use this wrapper so headers and bodies keep one spacing and sizing
 * language while their interiors stay domain-specific.
 */
export function PartModuleFrame({
  bodyClassName = "",
  children,
  className = "",
  headerActions,
  headerActionsGrow = false,
  headerPrimary,
  noteEmphasis,
  onKeyDownCapture,
  onPointerDownCapture,
  showHeader = true,
  style,
  widthMode = "auto",
}: PartModuleFrameProps) {
  const handlePointerDownCapture: PointerEventHandler<HTMLDivElement> = (
    event,
  ) => {
    onPointerDownCapture?.(event);

    if (
      onKeyDownCapture &&
      !event.defaultPrevented &&
      event.button === 0 &&
      !isInteractiveShortcutTarget(event.target)
    ) {
      event.currentTarget.focus({ preventScroll: true });
    }
  };

  return (
    <div
      className={`${styles.partModuleFrame} ${className}`}
      style={style}
      data-width-mode={widthMode}
      data-note-emphasis={noteEmphasis}
      onKeyDownCapture={onKeyDownCapture}
      onPointerDownCapture={handlePointerDownCapture}
      tabIndex={onKeyDownCapture ? -1 : undefined}
    >
      {showHeader && (headerPrimary || headerActions) ? (
        <ControlHeader
          actions={headerActions}
          actionsGrow={headerActionsGrow}
          primary={headerPrimary}
        />
      ) : null}
      <div className={styles.scrollArea}>
        <div className={`${styles.content} ${bodyClassName}`}>{children}</div>
      </div>
    </div>
  );
}
