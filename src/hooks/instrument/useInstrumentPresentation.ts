import { useCallback, useRef, useState } from "react";
import {
  type InstrumentNoteEmphasis,
  type InstrumentNoteEmphasisSetter,
} from "@/types/instrument-note-emphasis";
import {
  type ActiveNotesLockSnapshot,
  type ActiveNotesSourceKey,
} from "@/types/instrument-active-note";
import {
  type InstrumentNoteInteractionMode,
  type InstrumentNoteInteractionModeSetter,
  type InstrumentPresentation,
} from "@/types/instrument";
import {
  type DisplayFormatId,
  type DisplayFormatSetter,
} from "@/data/displayFormats";
import { useControllableState } from "@/hooks/useControllableState";

interface UseInstrumentPresentationOptions {
  displayFormatId?: DisplayFormatId;
  initialDisplayFormatId?: DisplayFormatId;
  onDisplayFormatIdChange?: DisplayFormatSetter;
  noteEmphasis?: InstrumentNoteEmphasis;
  initialNoteEmphasis?: InstrumentNoteEmphasis;
  onNoteEmphasisChange?: InstrumentNoteEmphasisSetter;
  noteInteractionMode?: InstrumentNoteInteractionMode;
  initialNoteInteractionMode?: InstrumentNoteInteractionMode;
  onNoteInteractionModeChange?: InstrumentNoteInteractionModeSetter;
  initialIsModified?: boolean;
}

export function useInstrumentPresentation({
  displayFormatId,
  initialDisplayFormatId = "note-names",
  onDisplayFormatIdChange,
  noteEmphasis: controlledNoteEmphasis,
  initialNoteEmphasis = "large",
  onNoteEmphasisChange,
  noteInteractionMode: controlledNoteInteractionMode,
  initialNoteInteractionMode = "play",
  onNoteInteractionModeChange,
  initialIsModified = false,
}: UseInstrumentPresentationOptions = {}): InstrumentPresentation {
  const [activeDisplayFormatId, setActiveDisplayFormatId] =
    useControllableState({
      value: displayFormatId,
      defaultValue: initialDisplayFormatId,
      onChange: onDisplayFormatIdChange,
      controlled:
        displayFormatId !== undefined || onDisplayFormatIdChange !== undefined,
    });
  const [noteEmphasis, setNoteEmphasis] = useControllableState({
    value: controlledNoteEmphasis,
    defaultValue: initialNoteEmphasis,
    onChange: onNoteEmphasisChange,
    controlled:
      controlledNoteEmphasis !== undefined ||
      onNoteEmphasisChange !== undefined,
  });
  const [noteInteractionMode, setNoteInteractionMode] = useControllableState({
    value: controlledNoteInteractionMode,
    defaultValue: initialNoteInteractionMode,
    onChange: onNoteInteractionModeChange,
    controlled:
      controlledNoteInteractionMode !== undefined ||
      onNoteInteractionModeChange !== undefined,
  });
  const [emphasisResetKey, setEmphasisResetKey] = useState(0);
  const [isModified, setIsModified] = useState(initialIsModified);
  const activeNotesLockSnapshotRef = useRef<ActiveNotesLockSnapshot | null>(
    null,
  );
  const activeNotesSourceKeyRef = useRef<ActiveNotesSourceKey | null>(null);

  const resetNotes = () => setEmphasisResetKey((k) => k + 1);
  const getActiveNotesLockSnapshot = useCallback(
    () => activeNotesLockSnapshotRef.current,
    [],
  );
  const setActiveNotesLockSnapshot = useCallback(
    (snapshot: ActiveNotesLockSnapshot) => {
      activeNotesLockSnapshotRef.current = snapshot;
    },
    [],
  );
  const getActiveNotesSourceKey = useCallback(
    () => activeNotesSourceKeyRef.current,
    [],
  );
  const setActiveNotesSourceKey = useCallback(
    (sourceKey: ActiveNotesSourceKey) => {
      activeNotesSourceKeyRef.current = sourceKey;
    },
    [],
  );

  return {
    activeDisplayFormatId,
    setActiveDisplayFormatId,
    noteEmphasis,
    setNoteEmphasis,
    noteInteractionMode,
    setNoteInteractionMode,
    emphasisResetKey,
    resetNotes,
    isModified,
    setIsModified,
    getActiveNotesLockSnapshot,
    setActiveNotesLockSnapshot,
    getActiveNotesSourceKey,
    setActiveNotesSourceKey,
  };
}
