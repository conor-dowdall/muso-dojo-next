import {
  memo,
  type ReactNode,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { InstrumentNote, type InstrumentNoteSurface } from "./InstrumentNote";
import { type ActiveNote } from "@/types/instrument-active-note";
import {
  type InstrumentNoteInteractionOptions,
  type InstrumentNoteInteractionTarget,
} from "@/types/instrument";
import { type InstrumentNoteColor } from "@/types/note-colors";
import { createInstrumentNoteInteractionTarget } from "@/utils/instrument/createInstrumentNoteInteractionTarget";
import { isInstrumentNotePointerActivation } from "@/utils/interaction/isPrimaryPointerActivation";
import { setPointerModality } from "@/utils/interaction/pointerModality";
import styles from "./InstrumentNote.module.css";

interface InstrumentNoteCellProps {
  noteKey: string;
  note?: ActiveNote;
  noteColor?: InstrumentNoteColor;
  midi: number;
  label?: string;
  ariaLabel: string;
  isFocused: boolean;
  setItemRef: (key: string, el: HTMLElement | null) => void;
  handleKeyDown: (e: KeyboardEvent, key: string) => void;
  isToggleButton?: boolean;
  isHighlighted?: boolean;
  isPressed?: boolean;
  notePlacement?: "center" | "bottom";
  onPointerDown?: (event: PointerEvent<HTMLButtonElement>) => void;
  onInteract?: (
    target: InstrumentNoteInteractionTarget,
    options?: InstrumentNoteInteractionOptions,
  ) => void;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  width?: string;
  height?: string;
  largeSize?: string;
  surface?: InstrumentNoteSurface;
}

/**
 * Shared component for note interaction cells.
 */
function InstrumentNoteCellBase({
  noteKey,
  note,
  noteColor,
  midi,
  label,
  ariaLabel,
  isFocused,
  setItemRef,
  handleKeyDown,
  isToggleButton = false,
  isHighlighted,
  isPressed,
  notePlacement = "center",
  onPointerDown,
  onInteract,
  className = "",
  style,
  children,
  width,
  height,
  largeSize,
  surface,
}: InstrumentNoteCellProps) {
  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (!isInstrumentNotePointerActivation(event)) {
      return;
    }

    setPointerModality(event.currentTarget, event.pointerType);
    onPointerDown?.(event);
    onInteract?.(createInstrumentNoteInteractionTarget(noteKey, midi), {
      moveFocus: false,
    });
  };

  const handlePointerEnter = (event: PointerEvent<HTMLButtonElement>) => {
    setPointerModality(event.currentTarget, event.pointerType);
  };

  // Individual note emphasis (from ActiveNote) or fallback:
  // - Active notes with explicit emphasis: use it (overrides ancestor CSS)
  // - Active notes without explicit emphasis: undefined → no data-emphasis attr → ancestor CSS cascade applies
  // - Inactive notes: "hidden"
  const effectiveNote = {
    ...(note ?? { midi }),
    emphasis: note?.emphasis ?? (note ? undefined : "hidden"),
  };
  const pressed = isPressed ?? effectiveNote.emphasis !== "hidden";

  return (
    <button
      type="button"
      ref={(el) => setItemRef(noteKey, el)}
      className={`${styles.noteCell} ${className}`}
      tabIndex={isFocused ? 0 : -1}
      aria-label={ariaLabel}
      aria-pressed={isToggleButton ? pressed : undefined}
      data-note-highlighted={isHighlighted ? true : undefined}
      data-note-placement={notePlacement}
      style={style}
      onPointerDown={handlePointerDown}
      onPointerEnter={handlePointerEnter}
      onKeyDown={(e) => handleKeyDown(e, noteKey)}
    >
      <InstrumentNote
        note={effectiveNote}
        noteColor={noteColor}
        label={label}
        width={width}
        height={height}
        largeSize={largeSize}
        surface={surface}
      >
        {children}
      </InstrumentNote>
    </button>
  );
}

function activeNotesAreEqual(
  left: ActiveNote | undefined,
  right: ActiveNote | undefined,
) {
  return (
    left === right ||
    (left?.midi === right?.midi && left?.emphasis === right?.emphasis)
  );
}

function noteColorsAreEqual(
  left: InstrumentNoteColor | undefined,
  right: InstrumentNoteColor | undefined,
) {
  return (
    left === right ||
    (left?.index === right?.index && left?.value === right?.value)
  );
}

function instrumentNoteCellPropsAreEqual(
  previous: InstrumentNoteCellProps,
  next: InstrumentNoteCellProps,
) {
  return (
    previous.noteKey === next.noteKey &&
    activeNotesAreEqual(previous.note, next.note) &&
    noteColorsAreEqual(previous.noteColor, next.noteColor) &&
    previous.midi === next.midi &&
    previous.label === next.label &&
    previous.ariaLabel === next.ariaLabel &&
    previous.isFocused === next.isFocused &&
    previous.setItemRef === next.setItemRef &&
    previous.handleKeyDown === next.handleKeyDown &&
    previous.isToggleButton === next.isToggleButton &&
    previous.isHighlighted === next.isHighlighted &&
    previous.isPressed === next.isPressed &&
    previous.notePlacement === next.notePlacement &&
    previous.onPointerDown === next.onPointerDown &&
    previous.onInteract === next.onInteract &&
    previous.className === next.className &&
    previous.style === next.style &&
    previous.children === next.children &&
    previous.width === next.width &&
    previous.height === next.height &&
    previous.largeSize === next.largeSize &&
    previous.surface === next.surface
  );
}

export const InstrumentNoteCell = memo(
  InstrumentNoteCellBase,
  instrumentNoteCellPropsAreEqual,
);
