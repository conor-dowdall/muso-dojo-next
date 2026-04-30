import { useCallback, useMemo, useState } from "react";
import {
  type InstrumentNoteEmphasis,
  type InstrumentNoteEmphasisSetter,
} from "@/types/instrument-note-emphasis";
import { type InstrumentPresentation } from "@/types/instrument";
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
  initialIsModified?: boolean;
}

export function useInstrumentPresentation({
  displayFormatId,
  initialDisplayFormatId = "note-names",
  onDisplayFormatIdChange,
  noteEmphasis: controlledNoteEmphasis,
  initialNoteEmphasis = "large",
  onNoteEmphasisChange,
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
  const [emphasisResetKey, setEmphasisResetKey] = useState(0);
  const [isModified, setIsModified] = useState(initialIsModified);

  const resetNotes = useCallback(() => setEmphasisResetKey((k) => k + 1), []);

  return useMemo(
    () => ({
      activeDisplayFormatId,
      setActiveDisplayFormatId,
      noteEmphasis,
      setNoteEmphasis,
      emphasisResetKey,
      resetNotes,
      isModified,
      setIsModified,
    }),
    [
      activeDisplayFormatId,
      setActiveDisplayFormatId,
      noteEmphasis,
      setNoteEmphasis,
      emphasisResetKey,
      resetNotes,
      isModified,
    ],
  );
}
