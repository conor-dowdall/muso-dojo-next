import { useOptionalMusicPart } from "@/components/music-part/MusicPartContext";
import {
  normalizeRootNoteString,
  rootAndNoteCollection,
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

  const selectedDisplayLayer = getRootAndNoteDisplayFormat(
    activeDisplayFormatId,
  );
  const displayLayer =
    selectedDisplayLayer &&
    normalizedRootNote !== undefined &&
    rootAndNoteCollection.isDisplayLayerAvailable(
      selectedDisplayLayer,
      normalizedRootNote,
      effectiveNoteCollectionKey,
    )
      ? selectedDisplayLayer
      : rootAndNoteCollection.displayLayers.noteNames;

  const noteNames = displayLayer.get(
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
    conversionFn: displayLayer.get,
    normalizedRootNote,
  };
}
