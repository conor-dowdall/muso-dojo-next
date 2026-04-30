import { useOptionalMusicGroup } from "@/components/music-group/MusicGroupContext";
import {
  conversions,
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
  const musicGroup = useOptionalMusicGroup();

  const effectiveRootNote = rootNote ?? musicGroup?.rootNote ?? "C";
  const effectiveNoteCollectionKey: NoteCollectionKey =
    noteCollectionKey ?? musicGroup?.noteCollectionKey ?? "major";

  const normalizedRootNote = normalizeRootNoteString(effectiveRootNote);

  const showMidiNumbers = activeDisplayFormatId === "midi";

  const conversionFn = getRootAndNoteDisplayFormat(activeDisplayFormatId)
    ?.get as typeof conversions.rootAndNoteCollection.noteNames.get | undefined;

  const noteNames =
    conversionFn !== undefined && normalizedRootNote !== undefined
      ? (conversionFn(normalizedRootNote, effectiveNoteCollectionKey, {
          fillChromatic: true,
          rotateToRootInteger0: true,
        }) as string[])
      : (conversions.rootAndNoteCollection.noteNames.get(
          normalizedRootNote || "C",
          effectiveNoteCollectionKey,
          {
            fillChromatic: true,
            rotateToRootInteger0: true,
          },
        ) as string[]);

  return {
    effectiveRootNote,
    effectiveNoteCollectionKey,
    activeDisplayFormatId,
    noteNames,
    showMidiNumbers,
    conversionFn,
    normalizedRootNote,
  };
}
