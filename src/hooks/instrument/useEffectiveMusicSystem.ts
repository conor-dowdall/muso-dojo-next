import { useOptionalMusicPart } from "@/components/music-part/MusicPartContext";
import {
  conversions,
  isRootAndNoteCollectionConversionAvailable,
  normalizeRootNoteString,
  type NoteCollectionKey,
} from "@musodojo/music-theory-data";
import {
  getRootAndNoteDisplayFormat,
  type DisplayFormatId,
} from "@/data/displayFormats";

interface UseEffectiveMusicSystemProps {
  rootNote?: string;
  noteCollectionKey?: NoteCollectionKey;
  activeDisplayFormatId?: DisplayFormatId;
}

/**
 * Resolves the effective music system values using the Prop > Context > Default cascade.
 * Also computes derived values (conversion function, normalized root, note names)
 * that both Fretboard and Keyboard notes layers need.
 * Optimized via React Compiler.
 */
export function useEffectiveMusicSystem({
  rootNote,
  noteCollectionKey,
  activeDisplayFormatId = "note-names",
}: UseEffectiveMusicSystemProps) {
  const musicPart = useOptionalMusicPart();

  const effectiveRootNote = rootNote ?? musicPart?.rootNote ?? "C";
  const effectiveNoteCollectionKey: NoteCollectionKey =
    noteCollectionKey ?? musicPart?.noteCollectionKey ?? "major";

  const normalizedRootNote = normalizeRootNoteString(effectiveRootNote);

  const showMidiNumbers = activeDisplayFormatId === "midi";

  const selectedConversion = getRootAndNoteDisplayFormat(activeDisplayFormatId);
  const conversion =
    selectedConversion &&
    normalizedRootNote !== undefined &&
    isRootAndNoteCollectionConversionAvailable(
      selectedConversion,
      normalizedRootNote,
      effectiveNoteCollectionKey,
    )
      ? selectedConversion
      : conversions.rootAndNoteCollection.noteNames;

  const noteNames = conversion.get(
    normalizedRootNote || "C",
    effectiveNoteCollectionKey,
    {
      fillChromatic: true,
      rotateToRootInteger0: true,
    },
  );

  return {
    effectiveRootNote,
    effectiveNoteCollectionKey,
    activeDisplayFormatId,
    noteNames,
    showMidiNumbers,
    conversionFn: conversion.get,
    normalizedRootNote,
  };
}
