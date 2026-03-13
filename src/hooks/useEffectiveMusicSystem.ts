import { useMusicSystem } from "@/context/music-theory/MusicSystemContext";
import {
  conversions,
  normalizeRootNoteString,
  type NoteCollectionKey,
} from "@musodojo/music-theory-data";
import { getNoteNames } from "@/utils/music/getNoteNames";

interface UseEffectiveMusicSystemProps {
  rootNote?: string;
  noteCollectionKey?: NoteCollectionKey;
}

/**
 * Resolves the effective music system values using the Prop > Context > Default cascade.
 * Also computes derived values (conversion function, normalized root, note names)
 * that both Fretboard and Keyboard notes layers need.
 */
export function useEffectiveMusicSystem({
  rootNote,
  noteCollectionKey,
}: UseEffectiveMusicSystemProps) {
  const musicSystem = useMusicSystem();

  const effectiveRootNote = rootNote ?? musicSystem?.rootNote ?? "C";
  const effectiveNoteCollectionKey: NoteCollectionKey =
    noteCollectionKey ?? musicSystem?.noteCollectionKey ?? "major";
  const activeConversionId = musicSystem?.activeConversionId ?? "note-names";

  const conversionFn = Object.values(conversions.rootAndNoteCollection).find(
    (c) => c.id === activeConversionId,
  )?.get as typeof conversions.rootAndNoteCollection.noteNames.get | undefined;

  const normalizedRootNote = normalizeRootNoteString(effectiveRootNote);

  const noteNames =
    conversionFn !== undefined && normalizedRootNote !== undefined
      ? (conversionFn(normalizedRootNote, effectiveNoteCollectionKey, {
          fillChromatic: true,
          rotateToRootInteger0: true,
        }) as string[])
      : getNoteNames({
          rootNote: effectiveRootNote,
          noteCollectionKey: effectiveNoteCollectionKey,
        });

  const showMidiNumbers = activeConversionId === "midi";

  return {
    effectiveRootNote,
    effectiveNoteCollectionKey,
    activeConversionId,
    noteNames,
    showMidiNumbers,
  };
}
