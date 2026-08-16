import {
  audioPresets,
  getDefaultAudioPresetId,
  isAudioPresetAvailableOn,
  isAudioPresetId,
} from "@/audio/presets";
import {
  type ArrangementConfig,
  type ArrangementEndingConfig,
} from "@/types/arrangement";
import {
  DEFAULT_EXERCISE_OCTAVE_OFFSET,
  EXERCISE_MAX_OCTAVE_OFFSET,
  EXERCISE_MIN_OCTAVE_OFFSET,
} from "@/utils/exercise-looper/exerciseConfig";
import { getMidiForCollectionPosition } from "@/utils/exercise-looper/exerciseSequenceRange";
import { resolvePartBackingBand } from "@/utils/music-part/resolvePartBackingBand";
import {
  isRecord,
  normalizeOptionalRootNote,
} from "@/utils/session/normalizationPrimitives";
import { DEFAULT_PART_ROOT_NOTE } from "@/utils/session/sessionDefaults";
import { DEFAULT_SESSION_BACKING_BAND_AUDIO_PRESET_ID } from "@/utils/session/sessionBackingBand";

export const DEFAULT_ARRANGEMENT_ENDING_CONFIG: ArrangementEndingConfig = {
  audioPresetId: DEFAULT_SESSION_BACKING_BAND_AUDIO_PRESET_ID,
  octaveOffset: DEFAULT_EXERCISE_OCTAVE_OFFSET,
  rootNote: DEFAULT_PART_ROOT_NOTE,
};

export function normalizeArrangementEndingConfig(
  value: unknown,
): ArrangementEndingConfig | undefined {
  if (!isRecord(value)) return undefined;

  const audioPresetId =
    isAudioPresetId(value.audioPresetId) &&
    isAudioPresetAvailableOn(audioPresets[value.audioPresetId], "exercise")
      ? value.audioPresetId
      : DEFAULT_ARRANGEMENT_ENDING_CONFIG.audioPresetId;
  const octaveOffset =
    typeof value.octaveOffset === "number" &&
    Number.isInteger(value.octaveOffset) &&
    value.octaveOffset >= EXERCISE_MIN_OCTAVE_OFFSET &&
    value.octaveOffset <= EXERCISE_MAX_OCTAVE_OFFSET
      ? value.octaveOffset
      : DEFAULT_ARRANGEMENT_ENDING_CONFIG.octaveOffset;

  return {
    audioPresetId,
    octaveOffset,
    rootNote:
      normalizeOptionalRootNote(value.rootNote) ??
      DEFAULT_ARRANGEMENT_ENDING_CONFIG.rootNote,
  };
}

export function createArrangementEndingSeed(
  arrangement: ArrangementConfig,
): ArrangementEndingConfig {
  const firstEntry = arrangement.entries[0];
  const firstSection = arrangement.sections.find(
    ({ id }) => id === firstEntry?.sectionId,
  );
  const firstPart = firstSection?.parts[0];

  if (!firstPart || !firstSection) {
    return { ...DEFAULT_ARRANGEMENT_ENDING_CONFIG };
  }

  const resolvedBand = resolvePartBackingBand(
    firstPart,
    firstSection.backingBand,
  );
  const selectedModule = resolvedBand.backingNotes.module;
  const rootNote =
    firstPart.authoredProgression?.tonalCenter ??
    normalizeOptionalRootNote(firstPart.rootNote) ??
    DEFAULT_ARRANGEMENT_ENDING_CONFIG.rootNote;

  return {
    audioPresetId: selectedModule
      ? (selectedModule.audioPresetId ?? getDefaultAudioPresetId("exercise"))
      : (resolvedBand.session.looper.audioPresetId ??
        DEFAULT_ARRANGEMENT_ENDING_CONFIG.audioPresetId),
    octaveOffset: selectedModule
      ? (selectedModule.octaveOffset ?? DEFAULT_EXERCISE_OCTAVE_OFFSET)
      : (resolvedBand.session.looper.octaveOffset ??
        DEFAULT_ARRANGEMENT_ENDING_CONFIG.octaveOffset),
    rootNote,
  };
}

export function getArrangementEndingMidi({
  octaveOffset,
  rootNote,
}: Pick<ArrangementEndingConfig, "octaveOffset" | "rootNote">) {
  return (
    getMidiForCollectionPosition({
      collectionKey: "major",
      octaveOffset,
      position: 0,
      rootNote,
    }) ??
    getMidiForCollectionPosition({
      collectionKey: "major",
      octaveOffset: DEFAULT_ARRANGEMENT_ENDING_CONFIG.octaveOffset,
      position: 0,
      rootNote: DEFAULT_ARRANGEMENT_ENDING_CONFIG.rootNote,
    })!
  );
}
