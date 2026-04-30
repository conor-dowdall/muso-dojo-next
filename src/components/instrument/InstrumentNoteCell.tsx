import { type ReactNode, type CSSProperties, type KeyboardEvent } from "react";
import { InstrumentNote } from "./InstrumentNote";
import { type ActiveNote } from "@/types/instrument-active-note";
import styles from "./InstrumentNote.module.css";

interface InstrumentNoteCellProps {
  noteKey: string;
  note?: ActiveNote;
  midi: number;
  label?: string;
  ariaLabel: string;
  isFocused: boolean;
  setItemRef: (key: string, el: HTMLElement | null) => void;
  handleKeyDown: (e: KeyboardEvent, key: string) => void;
  onPointerDown?: () => void;
  onInteraction?: (key: string) => void;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  width?: string;
  height?: string;
  largeSize?: string;
}

/**
 * Shared component for note interaction cells.
 */
export function InstrumentNoteCell({
  noteKey,
  note,
  midi,
  label,
  ariaLabel,
  isFocused,
  setItemRef,
  handleKeyDown,
  onPointerDown,
  onInteraction,
  className = "",
  style,
  children,
  width,
  height,
  largeSize,
}: InstrumentNoteCellProps) {
  const handlePointerDown = () => {
    onPointerDown?.();
    onInteraction?.(noteKey);
  };

  // Individual note emphasis (from ActiveNote) or fallback:
  // - Active notes with explicit emphasis: use it (overrides ancestor CSS)
  // - Active notes without explicit emphasis: undefined → no data-emphasis attr → ancestor CSS cascade applies
  // - Inactive notes: "hidden"
  const effectiveNote = {
    ...(note ?? { midi }),
    emphasis: note?.emphasis ?? (note ? undefined : "hidden"),
  };

  return (
    <button
      type="button"
      ref={(el) => setItemRef(noteKey, el)}
      className={`${styles.noteCell} ${className}`}
      tabIndex={isFocused ? 0 : -1}
      aria-label={ariaLabel}
      aria-pressed={effectiveNote.emphasis !== "hidden"}
      style={style}
      onPointerDown={handlePointerDown}
      onKeyDown={(e) => handleKeyDown(e, noteKey)}
    >
      <InstrumentNote
        note={effectiveNote}
        label={label}
        width={width}
        height={height}
        largeSize={largeSize}
      >
        {children}
      </InstrumentNote>
    </button>
  );
}
