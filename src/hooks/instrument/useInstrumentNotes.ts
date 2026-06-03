import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useEffectiveMusicSystem } from "@/hooks/instrument/useEffectiveMusicSystem";
import { useActiveNotes } from "@/hooks/instrument/useActiveNotes";
import {
  type ActiveNotes,
  type ActiveNotesLockSnapshot,
  type ActiveNotesSetter,
} from "@/types/instrument-active-note";
import {
  getDefaultAudioPresetId,
  musoAudioEngine,
  resolveAudioPreset,
  type AudioPresetId,
} from "@/audio";
import {
  type InstrumentNoteInteractionMode,
  type InstrumentNoteInteractionTarget,
} from "@/types/instrument";
import { applyInstrumentNoteEdit } from "@/utils/instrument/applyInstrumentNoteEdit";
import { getNoteAriaLabel } from "@/utils/instrument/getNoteAriaLabel";
import { areActiveNotesEqual } from "@/utils/instrument/areActiveNotesEqual";
import { createActiveNotesLockSnapshot } from "@/utils/instrument/createActiveNotesLockSnapshot";
import {
  createActiveNotesDependencyKey,
  createActiveNotesSourceKey,
} from "@/utils/instrument/activeNotesSourceKey";
import { resolveInstrumentNoteInteractionMode } from "@/utils/instrument/resolveInstrumentInteractionMode";
import { useNoteColors } from "@/components/note-colors/NoteColorProvider";
import { resolveInstrumentNoteColor } from "@/utils/note-colors/resolveNoteColors";
import { assertNever } from "@/utils/assertNever";

import { type NoteCollectionKey } from "@musodojo/music-theory-data";
import { type InstrumentNoteEmphasis } from "@/types/instrument-note-emphasis";
import { type DisplayFormatId } from "@/data/displayFormats";

interface UseInstrumentNotesParams {
  activeNotes?: ActiveNotes;
  onActiveNotesChange?: ActiveNotesSetter;
  noteCollectionKey?: NoteCollectionKey;
  rootNote?: string;
  activeDisplayFormatId: DisplayFormatId;
  activeNotesLocked?: boolean;
  noteInteractionMode: InstrumentNoteInteractionMode;
  noteTargets?: readonly InstrumentNoteInteractionTarget[];
  previewAudioPresetId: AudioPresetId;
  noteEmphasis?: InstrumentNoteEmphasis;
  emphasisResetKey?: number;
  dependencies?: string[];
  getInitialActiveNotes: (params: {
    rootNote: string;
    noteCollectionKey: NoteCollectionKey;
  }) => ActiveNotes;
  setIsModified?: (isModified: boolean) => void;
  setActiveNotesLockSnapshot?: (snapshot: ActiveNotesLockSnapshot) => void;
  setActiveNotesSourceKey?: (sourceKey: string) => void;
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
  noteInteractionMode,
  noteTargets = [],
  previewAudioPresetId,
  noteEmphasis = "large",
  emphasisResetKey = 0,
  dependencies = [],
  getInitialActiveNotes,
  setIsModified,
  setActiveNotesLockSnapshot,
  setActiveNotesSourceKey,
}: UseInstrumentNotesParams) {
  const [previewActiveKeys, setPreviewActiveKeys] = useState<
    ReadonlySet<string>
  >(() => new Set());
  const previewActiveTokensRef = useRef(new Map<string, number>());
  const previewActiveTimeoutsRef = useRef(
    new Map<string, ReturnType<typeof setTimeout>>(),
  );
  const musicSystem = useEffectiveMusicSystem({
    rootNote,
    noteCollectionKey,
    activeDisplayFormatId,
  });
  const noteColors = useNoteColors();

  // Build dependency string for useActiveNotes.
  // noteEmphasis and activeDisplayFormatId are intentionally excluded —
  // they're display concerns, not data concerns.
  // emphasisResetKey triggers a full recalculation when the reset button is clicked.
  const activeNotesSourceKey = createActiveNotesSourceKey({
    rootNote: musicSystem.effectiveRootNote,
    noteCollectionKey: musicSystem.effectiveNoteCollectionKey,
    topologyKeys: dependencies,
  });
  const fullDependencies = createActiveNotesDependencyKey(
    activeNotesSourceKey,
    emphasisResetKey,
  );

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
    },
  );

  const isModified = initialActiveNotes
    ? !areActiveNotesEqual(activeNotes, initialActiveNotes)
    : false;

  useEffect(() => {
    setIsModified?.(isModified);
  }, [isModified, setIsModified]);

  useLayoutEffect(() => {
    setActiveNotesSourceKey?.(activeNotesSourceKey);

    if (!activeNotesLocked) {
      setActiveNotesLockSnapshot?.(
        createActiveNotesLockSnapshot(activeNotes, activeNotesSourceKey),
      );
    }
  }, [
    activeNotes,
    activeNotesLocked,
    activeNotesSourceKey,
    setActiveNotesLockSnapshot,
    setActiveNotesSourceKey,
  ]);

  const effectiveNoteInteractionMode = resolveInstrumentNoteInteractionMode({
    activeNotesLocked,
    noteInteractionMode,
  });
  const clearPreviewActiveKey = (key: string, token?: number) => {
    if (
      token !== undefined &&
      previewActiveTokensRef.current.get(key) !== token
    ) {
      return;
    }

    const timeout = previewActiveTimeoutsRef.current.get(key);

    if (timeout !== undefined) {
      clearTimeout(timeout);
      previewActiveTimeoutsRef.current.delete(key);
    }

    previewActiveTokensRef.current.delete(key);
    setPreviewActiveKeys((currentKeys) => {
      if (!currentKeys.has(key)) {
        return currentKeys;
      }

      const nextKeys = new Set(currentKeys);
      nextKeys.delete(key);
      return nextKeys;
    });
  };
  const markPreviewActiveKey = (key: string, durationSeconds: number) => {
    const token = (previewActiveTokensRef.current.get(key) ?? 0) + 1;
    const currentTimeout = previewActiveTimeoutsRef.current.get(key);

    if (currentTimeout !== undefined) {
      clearTimeout(currentTimeout);
    }

    previewActiveTokensRef.current.set(key, token);
    setPreviewActiveKeys((currentKeys) => {
      if (currentKeys.has(key)) {
        return currentKeys;
      }

      const nextKeys = new Set(currentKeys);
      nextKeys.add(key);
      return nextKeys;
    });

    const timeout = setTimeout(
      () => clearPreviewActiveKey(key, token),
      Math.max(0, durationSeconds) * 1000,
    );
    previewActiveTimeoutsRef.current.set(key, timeout);

    return token;
  };

  useEffect(
    () => () => {
      previewActiveTimeoutsRef.current.forEach((timeout) =>
        clearTimeout(timeout),
      );
      previewActiveTimeoutsRef.current.clear();
      previewActiveTokensRef.current.clear();
    },
    [],
  );

  const handleInteract = (target: InstrumentNoteInteractionTarget) => {
    switch (effectiveNoteInteractionMode) {
      case "play": {
        const preset = resolveAudioPreset(
          previewAudioPresetId,
          getDefaultAudioPresetId("preview"),
        );
        const token = markPreviewActiveKey(
          target.key,
          preset.defaultDurationSeconds,
        );

        void musoAudioEngine
          .playNote({
            midiNote: target.midi,
            use: "preview",
            presetId: previewAudioPresetId,
          })
          .then((handle) => {
            if (handle === undefined) {
              clearPreviewActiveKey(target.key, token);
            }
          })
          .catch(() => clearPreviewActiveKey(target.key, token));
        return;
      }
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
      mode: noteColors.mode,
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
    previewActiveKeys,
  };
}
