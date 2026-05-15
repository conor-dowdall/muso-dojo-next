import { type ReactNode, type CSSProperties } from "react";
import { InstrumentHeader } from "./InstrumentHeader";
import { type InstrumentNoteEmphasis } from "@/types/instrument-note-emphasis";
import {
  type InstrumentIntrinsicSizing,
  type InstrumentLayoutConfig,
} from "@/types/instrument-layout";
import { resolveInstrumentLayout } from "@/utils/instrument/resolveInstrumentLayout";
import styles from "./InstrumentContainer.module.css";

interface InstrumentContainerProps {
  displayControls?: ReactNode;
  headerActions?: ReactNode;
  children: ReactNode;
  showHeader?: boolean;
  className?: string;
  bodyClassName?: string;
  style?: CSSProperties;
  noteEmphasis?: InstrumentNoteEmphasis;
  sizing?: InstrumentIntrinsicSizing;
  layout?: InstrumentLayoutConfig;
}

/**
 * Shared container for all instruments (Fretboard, Keyboard, etc.)
 * Standardizes the relationship between the instrument header and the body.
 */
export function InstrumentContainer({
  displayControls,
  headerActions,
  children,
  showHeader = true,
  className = "",
  bodyClassName = "",
  style,
  noteEmphasis,
  sizing,
  layout,
}: InstrumentContainerProps) {
  const resolvedLayout = resolveInstrumentLayout(sizing, layout);

  return (
    <div
      className={`${styles.instrumentContainer} ${className}`}
      style={{ ...resolvedLayout.style, ...style }}
      data-width-mode={resolvedLayout.widthMode}
      data-note-emphasis={noteEmphasis}
    >
      {showHeader && (displayControls || headerActions) ? (
        <InstrumentHeader displayControls={displayControls}>
          {headerActions}
        </InstrumentHeader>
      ) : null}
      <div className={styles.scrollArea}>
        <div className={`${styles.content} ${bodyClassName}`}>{children}</div>
      </div>
    </div>
  );
}
