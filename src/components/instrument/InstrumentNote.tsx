import { type ActiveNote } from "@/types/instrument-active-note";
import styles from "./InstrumentNote.module.css";
import { type CSSProperties, type ReactNode } from "react";

interface InstrumentNoteProps {
  note: ActiveNote;
  label?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  width?: string;
  height?: string;
  largeSize?: string;
}

/**
 * Universal InstrumentNote component for all instruments.
 * Handles rendering logic for different emphasis states and labeling.
 *
 * Font sizing is handled entirely by CSS Container Queries —
 * the parent .noteCell is a size container, and this component
 * sets data-chars so CSS can pick the right width-scaling factor
 * before comparing to height.
 */
export function InstrumentNote({
  note,
  label,
  className = "",
  style,
  children,
  width,
  height,
  largeSize = "85%",
}: InstrumentNoteProps) {
  const emphasis = note.emphasis;
  const isHidden = emphasis === "hidden";

  // Chromatic pitch color calculation (0-11)
  const pitchIndex = note.midi % 12;
  const pitchColorVar = `var(--pitch-${pitchIndex})`;

  // Physical size is stabilized to prevent layout reflows.
  const effectiveWidth = width ?? largeSize;
  const effectiveHeight = height ?? (width ? "auto" : largeSize);

  // Derived character count for CSS sizing
  const charCount = label ? Math.min(label.length, 5) : undefined;

  return (
    <div
      data-emphasis={emphasis}
      data-pitch={pitchIndex}
      data-is-placeholder={label === ""}
      data-chars={charCount}
      className={className ? `${styles.note} ${className}` : styles.note}
      style={
        {
          ...style,
          "--note-width": effectiveWidth,
          "--note-height": effectiveHeight,
          "--pitch-color": pitchColorVar,
          visibility: isHidden ? "hidden" : undefined,
        } as CSSProperties
      }
    >
      <NoteLabel label={label} />
      {children}
    </div>
  );
}

/**
 * Handles semantic label rendering:
 * - undefined: 'none' format (render nothing)
 * - "": missing from collection (render placeholder dash)
 * - string: real text (render label)
 */
function NoteLabel({
  label,
  isHidden,
}: {
  label?: string;
  isHidden?: boolean;
}) {
  if (label === undefined || isHidden) return null;

  if (label === "") {
    return <span className={styles.label} data-is-placeholder="true" />;
  }

  return <span className={styles.label}>{label}</span>;
}
