import { useEffect, useLayoutEffect } from "react";
import { useEffectiveMusicSystem } from "@/hooks/instrument/useEffectiveMusicSystem";
import { useActiveNotes } from "@/hooks/instrument/useActiveNotes";
import {
  type ActiveNotes,
  type ActiveNotesSetter,
} from "@/types/instrument-active-note";
import { musoAudioEngine, type AudioPresetId } from "@/audio";
import {
  type InstrumentNoteInteractionMode,
  type InstrumentNoteInteractionTarget,
} from "@/types/instrument";
import { applyInstrumentNoteEdit } from "@/utils/instrument/applyInstrumentNoteEdit";
import { getNoteAriaLabel } from "@/utils/instrument/getNoteAriaLabel";
import { areActiveNotesEqual } from "@/utils/instrument/areActiveNotesEqual";
import { createActiveNotesLockSnapshot } from "@/utils/instrument/createActiveNotesLockSnapshot";
import { useSessionNoteColors } from "@/components/note-colors/SessionNoteColorProvider";
import { resolveInstrumentNoteColor } from "@/utils/note-colors/resolveNoteColors";
import { assertNever } from "@/utils/assertNever";

import { type NoteCollectionKey } from "@musodojo/music-theory-data";
import { type InstrumentNoteEmphasis } from "@/types/instrument-note-emphasis";
import { type DisplayFormatId } from "@/data/displayFormats";

const DEFAULT_PREVIEW_NOTE_DURATION_SECONDS = 0.6;

interface UseInstrumentNotesParams {
  activeNotes?: ActiveNotes;
  onActiveNotesChange?: ActiveNotesSetter;
  noteCollectionKey?: NoteCollectionKey;
  rootNote?: string;
  activeDisplayFormatId: DisplayFormatId;
  activeNotesLocked?: boolean;
  activeNotesLockPreservesEdits?: boolean;
  noteInteractionMode: InstrumentNoteInteractionMode;
  noteTargets?: readonly InstrumentNoteInteractionTarget[];
  previewAudioPresetId: AudioPresetId;
  previewDurationSeconds?: number;
  noteEmphasis?: InstrumentNoteEmphasis;
  emphasisResetKey?: number;
  dependencies?: string[];
  getInitialActiveNotes: (params: {
    rootNote: string;
    noteCollectionKey: NoteCollectionKey;
  }) => ActiveNotes;
  setIsModified?: (isModified: boolean) => void;
  setActiveNotesLockSnapshot?: (snapshot: ActiveNotes) => void;
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
  activeNotesLocked = false,
  activeNotesLockPreservesEdits = true,
  noteInteractionMode,
  noteTargets = [],
  previewAudioPresetId,
  previewDurationSeconds = DEFAULT_PREVIEW_NOTE_DURATION_SECONDS,
  noteEmphasis = "large",
  emphasisResetKey = 0,
  dependencies = [],
  getInitialActiveNotes,
  setIsModified,
  setActiveNotesLockSnapshot,
}: UseInstrumentNotesParams) {
  const musicSystem = useEffectiveMusicSystem({
    rootNote,
    noteCollectionKey,
    activeDisplayFormatId,
  });
  const sessionNoteColors = useSessionNoteColors();

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
    {
      preserveOnDependencyChange: activeNotesLocked,
      preserveStaleNotesOnUnlock: activeNotesLockPreservesEdits,
    },
  );

  const isModified = initialActiveNotes
    ? !areActiveNotesEqual(activeNotes, initialActiveNotes)
    : false;

  useEffect(() => {
    setIsModified?.(isModified);
  }, [isModified, setIsModified]);

  useLayoutEffect(() => {
    setActiveNotesLockSnapshot?.(createActiveNotesLockSnapshot(activeNotes));
  }, [activeNotes, setActiveNotesLockSnapshot]);

  const effectiveNoteInteractionMode = activeNotesLocked
    ? "play"
    : noteInteractionMode;

  const handleInteract = (target: InstrumentNoteInteractionTarget) => {
    switch (effectiveNoteInteractionMode) {
      case "play":
        void musoAudioEngine
          .playNote({
            midiNote: target.midi,
            durationSeconds: previewDurationSeconds,
            use: "preview",
            presetId: previewAudioPresetId,
          })
          .catch(() => undefined);
        return;
      case "edit-one":
        if (activeNotesLocked) {
          return;
        }

        onActiveNotesChange?.((currentNotes) =>
          applyInstrumentNoteEdit({
            activeNotes: currentNotes,
            allTargets: noteTargets,
            globalEmphasis: noteEmphasis,
            scope: "one",
            target,
          }),
        );
        return;
      case "edit-pitch-class":
        if (activeNotesLocked) {
          return;
        }

        onActiveNotesChange?.((currentNotes) =>
          applyInstrumentNoteEdit({
            activeNotes: currentNotes,
            allTargets: noteTargets,
            globalEmphasis: noteEmphasis,
            scope: "pitch-class",
            target,
          }),
        );
        return;
      default:
        return assertNever(
          effectiveNoteInteractionMode,
          "Unsupported note interaction mode",
        );
    }
  };

  const getAriaLabel = (
    context:
      | { type: "fretboard"; stringIndex: number; fretNumber: number }
      | { type: "keyboard"; isBlack: boolean; midi: number },
    midi: number,
  ) => {
    const noteName = musicSystem.noteNames?.[midi % 12];
    const label = getNoteAriaLabel(context, noteName);

    switch (effectiveNoteInteractionMode) {
      case "play":
        return `Play ${label}`;
      case "edit-one":
        return `Edit ${label}`;
      case "edit-pitch-class":
        return `Edit all notes matching ${noteName ?? label}`;
      default:
        return assertNever(
          effectiveNoteInteractionMode,
          "Unsupported note interaction mode",
        );
    }
  };

  const noteLabels: Record<number, string | undefined> = {};
  for (let midi = 0; midi < 128; midi++) {
    if (activeDisplayFormatId === "none") {
      noteLabels[midi] = undefined;
    } else {
      const label = musicSystem.showMidiNumbers
        ? String(midi)
        : musicSystem.noteNames?.[midi % 12];
      noteLabels[midi] = label || "";
    }
  }

  const getNoteLabel = (midi: number) => noteLabels[midi];
  const getNoteColor = (midi: number) =>
    resolveInstrumentNoteColor({
      midi,
      mode: sessionNoteColors.mode,
      rootNote: musicSystem.normalizedRootNote,
    });

  return {
    ...musicSystem,
    activeNotes,
    onActiveNotesChange,
    noteInteractionMode: effectiveNoteInteractionMode,
    handleInteract,
    getAriaLabel,
    getNoteLabel,
    getNoteColor,
    noteLabels,
  };
}
