import {
  chordProgressions,
  getChordProgressionChordChangeReferences,
  getChordProgressionUniqueChordReferences,
  normalizeRootNoteString,
  type ChordProgressionChordReference,
  type ChordProgressionKey,
  type RootNote,
} from "@musodojo/music-theory-data";
import {
  createDefaultPartModuleConfigs,
  createEntityId,
} from "@/utils/session/createSessionEntities";
import { normalizeMusicPartConfig } from "@/utils/session/normalizeMusicPartConfig";
import {
  type ChordProgressionChordListMode,
  type MusicPartConfig,
  type PartModuleConfig,
  type PartModuleCreationRequest,
  type PartModuleType,
} from "@/types/session";
import { DEFAULT_PART_ROOT_NOTE } from "@/utils/session/sessionDefaults";
import {
  PART_DURATION_BEATS_PER_BAR,
  getRepresentablePartDurationBeats,
  getRhythmSelectionForBeatCount,
} from "@/utils/music-part/partDuration";
import {
  DEFAULT_RHYTHM_SELECTION,
  getRhythmSelectionRecipe,
} from "@/utils/rhythm/rhythmConfig";

const BAR_DURATION_IN_BARS = 1;
const DURATION_EPSILON = 0.000_001;
const DURATION_PRECISION = 1_000_000;

type CreateChordProgressionPartsOptions<
  T extends PartModuleType = PartModuleType,
> = {
  rootNote: string;
  progressionKey: ChordProgressionKey;
  chordListMode?: ChordProgressionChordListMode;
  moduleRequests: PartModuleCreationRequest<T>[];
};

function createProgressionPartId(
  progressionKey: ChordProgressionKey,
  index: number,
) {
  return createEntityId(`part-${progressionKey}-${index + 1}`);
}

interface DurationAwareChordProgression {
  chords: readonly { durationInBars: number }[];
}

interface ProgressionPartReference {
  durationInBars?: number;
  reference: ChordProgressionChordReference;
  rhythmBeatCount?: number;
}

function normalizeSegmentDuration(durationInBars: number) {
  return Math.round(durationInBars * DURATION_PRECISION) / DURATION_PRECISION;
}

function getRhythmBeatCountForSegmentWithBarBeats(
  durationInBars: number,
  beatsPerBar: number,
) {
  if (Math.abs(durationInBars - BAR_DURATION_IN_BARS) <= DURATION_EPSILON) {
    return undefined;
  }

  return getRepresentablePartDurationBeats(durationInBars, beatsPerBar);
}

function getProgressionChordDurationInBars(
  progression: DurationAwareChordProgression | undefined,
  index: number,
) {
  const durationInBars = progression?.chords[index]?.durationInBars;

  return typeof durationInBars === "number" &&
    Number.isFinite(durationInBars) &&
    durationInBars > DURATION_EPSILON
    ? durationInBars
    : BAR_DURATION_IN_BARS;
}

function createFullProgressionPartReferences(
  rootNote: RootNote,
  progressionKey: ChordProgressionKey,
  beatsPerBar = PART_DURATION_BEATS_PER_BAR,
): ProgressionPartReference[] {
  const progression = chordProgressions[progressionKey] as
    | DurationAwareChordProgression
    | undefined;
  const references = getChordProgressionChordChangeReferences(
    rootNote,
    progressionKey,
  );
  const partReferences: ProgressionPartReference[] = [];
  let currentBarPosition = 0;

  references.forEach((reference, referenceIndex) => {
    let remainingDuration = getProgressionChordDurationInBars(
      progression,
      referenceIndex,
    );

    while (remainingDuration > DURATION_EPSILON) {
      const remainingBarDuration = BAR_DURATION_IN_BARS - currentBarPosition;
      const durationInBars = normalizeSegmentDuration(
        Math.min(remainingDuration, remainingBarDuration),
      );
      const rhythmBeatCount = getRhythmBeatCountForSegmentWithBarBeats(
        durationInBars,
        beatsPerBar,
      );

      partReferences.push({
        reference,
        ...(rhythmBeatCount !== undefined ? { durationInBars } : {}),
        ...(rhythmBeatCount !== undefined ? { rhythmBeatCount } : {}),
      });

      remainingDuration -= durationInBars;
      currentBarPosition += durationInBars;

      if (currentBarPosition >= BAR_DURATION_IN_BARS - DURATION_EPSILON) {
        currentBarPosition = 0;
      }
    }
  });

  return partReferences;
}

function createUniqueProgressionPartReferences(
  rootNote: RootNote,
  progressionKey: ChordProgressionKey,
): ProgressionPartReference[] {
  return getChordProgressionUniqueChordReferences(rootNote, progressionKey).map(
    (reference) => ({ reference }),
  );
}

function applyProgressionRhythmBeatCount(
  module: PartModuleConfig,
  rhythmBeatCount: number,
): PartModuleConfig {
  if (module.type !== "rhythm") {
    return module;
  }

  return {
    ...module,
    rhythm: getRhythmSelectionForBeatCount(rhythmBeatCount, module.rhythm),
  };
}

function getRequestedRhythmBeatsPerBar(
  moduleRequests: readonly PartModuleCreationRequest[],
) {
  const rhythmRequest = moduleRequests.find(
    (request) => request.type === "rhythm",
  );
  const rhythm = rhythmRequest?.settings?.rhythm ?? DEFAULT_RHYTHM_SELECTION;

  return getRhythmSelectionRecipe(rhythm).beats;
}

function createPartFromReference<T extends PartModuleType>({
  moduleRequests,
  partId,
  partReference,
}: {
  moduleRequests: PartModuleCreationRequest<T>[];
  partId: string;
  partReference: ProgressionPartReference;
}): MusicPartConfig {
  const modules = createDefaultPartModuleConfigs(moduleRequests);
  const rhythmBeatCount = partReference.rhythmBeatCount;
  const resolvedModules =
    rhythmBeatCount === undefined
      ? modules
      : modules.map((module) =>
          applyProgressionRhythmBeatCount(module, rhythmBeatCount),
        );
  const part = normalizeMusicPartConfig({
    id: partId,
    rootNote: partReference.reference.rootNote,
    noteCollectionKey: partReference.reference.noteCollectionKey,
    durationInBars: partReference.durationInBars,
    modules: resolvedModules,
  });

  if (!part) {
    throw new Error("Unable to create chord progression part");
  }

  return part;
}

export function createChordProgressionParts<
  T extends PartModuleType = PartModuleType,
>({
  rootNote,
  progressionKey,
  chordListMode = "each-chord-once",
  moduleRequests,
}: CreateChordProgressionPartsOptions<T>): MusicPartConfig[] {
  const normalizedRootNote = (normalizeRootNoteString(rootNote) ??
    DEFAULT_PART_ROOT_NOTE) as RootNote;
  const rhythmBeatsPerBar = getRequestedRhythmBeatsPerBar(moduleRequests);
  const references: readonly ProgressionPartReference[] =
    chordListMode === "full-song-order"
      ? createFullProgressionPartReferences(
          normalizedRootNote,
          progressionKey,
          rhythmBeatsPerBar,
        )
      : createUniqueProgressionPartReferences(
          normalizedRootNote,
          progressionKey,
        );

  return references.map((partReference, index) =>
    createPartFromReference({
      moduleRequests,
      partId: createProgressionPartId(progressionKey, index),
      partReference,
    }),
  );
}
