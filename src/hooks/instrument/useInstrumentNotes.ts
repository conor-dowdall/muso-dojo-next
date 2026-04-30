import { useEffect } from "react";
import { useEffectiveMusicSystem } from "@/hooks/instrument/useEffectiveMusicSystem";
import { useActiveNotes } from "@/hooks/instrument/useActiveNotes";
import {
  type ActiveNotes,
  type ActiveNotesSetter,
} from "@/types/instrument-active-note";
import { toggleNote } from "@/utils/instrument/toggleNote";
import { getNoteAriaLabel } from "@/utils/instrument/getNoteAriaLabel";
import { areActiveNotesEqual } from "@/utils/instrument/areActiveNotesEqual";

import { type NoteCollectionKey } from "@musodojo/music-theory-data";
import { type InstrumentNoteEmphasis } from "@/types/instrument-note-emphasis";
import { type DisplayFormatId } from "@/data/displayFormats";

interface UseInstrumentNotesParams {
  activeNotes?: ActiveNotes;
  onActiveNotesChange?: ActiveNotesSetter;
  noteCollectionKey?: NoteCollectionKey;
  rootNote?: string;
  activeDisplayFormatId: DisplayFormatId;
  showMidiNumbers?: boolean;
  noteEmphasis?: InstrumentNoteEmphasis;
  emphasisResetKey?: number;
  dependencies?: string[];
  getInitialActiveNotes: (params: {
    rootNote: string;
    noteCollectionKey: NoteCollectionKey;
  }) => ActiveNotes;
  setIsModified?: (isModified: boolean) => void;
}

/**
 * Unified hook for handling instrument notes layer logic.
 * Encapsulates music system context, active notes management, and emphasis.
 * Optimized via React Compiler, so manual memoization is omitted.
 */
export function useInstrumentNotes({
  activeNotes: externalActiveNotes,
  onActiveNotesChange: externalOnChange,
  noteCollectionKey,
  rootNote,
  activeDisplayFormatId,
  showMidiNumbers: externalShowMidiNumbers,
  noteEmphasis = "large",
  emphasisResetKey = 0,
  dependencies = [],
  getInitialActiveNotes,
  setIsModified,
}: UseInstrumentNotesParams) {
  const musicSystem = useEffectiveMusicSystem({
    rootNote,
    noteCollectionKey,
    activeDisplayFormatId,
  });

  const effectiveShowMidiNumbers =
    externalShowMidiNumbers ?? musicSystem.showMidiNumbers;

  // Build dependency string for useActiveNotes.
  // noteEmphasis and activeDisplayFormatId are intentionally excluded —
  // they're display concerns, not data concerns.
  // emphasisResetKey triggers a full recalculation when the reset button is clicked.
  const fullDependencies = [
    musicSystem.effectiveRootNote,
    musicSystem.effectiveNoteCollectionKey,
    ...dependencies,
    String(emphasisResetKey),
  ].join("-");

  const [activeNotes, onActiveNotesChange, initialActiveNotes] = useActiveNotes(
    externalActiveNotes,
    externalOnChange,
    fullDependencies,
    () =>
      getInitialActiveNotes({
        rootNote: musicSystem.effectiveRootNote,
        noteCollectionKey: musicSystem.effectiveNoteCollectionKey,
      }),
  );

  const isModified = initialActiveNotes
    ? !areActiveNotesEqual(activeNotes, initialActiveNotes)
    : false;

  useEffect(() => {
    setIsModified?.(isModified);
  }, [isModified, setIsModified]);

  const handleToggle = (key: string, midi: number) => {
    toggleNote({
      key,
      midi,
      onActiveNotesChange,
      globalEmphasis: noteEmphasis,
    });
  };

  const getAriaLabel = (
    context:
      | { type: "fretboard"; stringIndex: number; fretNumber: number }
      | { type: "keyboard"; isBlack: boolean; midi: number },
    midi: number,
  ) => {
    const noteName = musicSystem.noteNames?.[midi % 12];
    return getNoteAriaLabel(context, noteName);
  };

  const noteLabels: Record<number, string | undefined> = {};
  for (let midi = 0; midi < 128; midi++) {
    if (activeDisplayFormatId === "none") {
      noteLabels[midi] = undefined;
    } else {
      const label = effectiveShowMidiNumbers
        ? String(midi)
        : musicSystem.noteNames?.[midi % 12];
      noteLabels[midi] = label || "";
    }
  }

  const getNoteLabel = (midi: number) => noteLabels[midi];

  return {
    ...musicSystem,
    activeNotes,
    onActiveNotesChange,
    effectiveShowMidiNumbers,
    handleToggle,
    getAriaLabel,
    getNoteLabel,
    noteLabels,
  };
}
