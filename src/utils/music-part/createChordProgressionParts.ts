import {
  chordProgression,
  normalizeRootNoteString,
  type ChordProgression,
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
  type AuthoredChordProgressionConfig,
  type AutomaticRhythmStyle,
  type MusicPartConfig,
  type PartModuleConfig,
  type PartModuleCreationRequest,
  type PartModuleType,
} from "@/types/session";
import { getChordProgressionRhythmProfile } from "@/utils/music-theory/chordProgressionRhythm";
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

type ChordProgressionCreationSelection =
  | {
      progression?: never;
      progressionKey: ChordProgressionKey;
      progressionName?: never;
    }
  | {
      progression: ChordProgression;
      progressionKey?: never;
      progressionName: string;
    };

type CreateChordProgressionPartsOptions<
  T extends PartModuleType = PartModuleType,
> = ChordProgressionCreationSelection & {
  rootNote: string;
  chordListMode?: ChordProgressionChordListMode;
  moduleRequests: PartModuleCreationRequest<T>[];
};

function createProgressionPartId(progressionIdentity: string, index: number) {
  return createEntityId(`part-${progressionIdentity}-${index + 1}`);
}

interface ProgressionPartReference {
  authoredProgression?: AuthoredChordProgressionConfig;
  durationInBars?: number;
  reference: ChordProgressionChordReference;
  rhythmBeatCount?: number;
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

function createFullProgressionPartReferences(
  rootNote: RootNote,
  progression: ChordProgression | ChordProgressionKey,
  progressionSource: AuthoredChordProgressionConfig["source"],
  progressionInstanceId: string,
  beatsPerBar = PART_DURATION_BEATS_PER_BAR,
): ProgressionPartReference[] {
  const resolved = chordProgression.resolve(rootNote, progression);

  return resolved.bars.flatMap((bar) =>
    bar.segments.map((segment) => {
      const event = resolved.events[segment.eventIndex];

      if (!event) {
        throw new Error(
          `Missing resolved chord progression event ${segment.eventIndex}`,
        );
      }

      const durationInBars = segment.durationInBars;
      const rhythmBeatCount = getRhythmBeatCountForSegmentWithBarBeats(
        durationInBars,
        beatsPerBar,
      );

      return {
        authoredProgression: {
          kind: "chord-progression" as const,
          noteCollectionKey: event.reference.chordCollectionKey,
          progressionInstanceId,
          source: progressionSource,
          romanSymbol: event.romanSymbol,
          rootNote: event.reference.rootNote,
          tonalCenter: rootNote,
        },
        reference: event.reference,
        ...(Math.abs(durationInBars - BAR_DURATION_IN_BARS) > DURATION_EPSILON
          ? { durationInBars }
          : {}),
        ...(rhythmBeatCount !== undefined ? { rhythmBeatCount } : {}),
      };
    }),
  );
}

function createUniqueProgressionPartReferences(
  rootNote: RootNote,
  progression: ChordProgression | ChordProgressionKey,
): ProgressionPartReference[] {
  return chordProgression
    .getUniqueChordReferences(rootNote, progression)
    .map((reference) => ({ reference }));
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
    authoredBarRhythm: module.rhythm,
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
  automaticRhythm,
}: {
  moduleRequests: PartModuleCreationRequest<T>[];
  partId: string;
  partReference: ProgressionPartReference;
  automaticRhythm: AutomaticRhythmStyle;
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
    rootNote: partReference.reference.practicalRootNote,
    noteCollectionKey: partReference.reference.chordCollectionKey,
    authoredProgression: partReference.authoredProgression,
    durationInBars: partReference.durationInBars,
    automaticRhythm: {
      style: automaticRhythm,
    },
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
  progression,
  progressionKey,
  progressionName,
  chordListMode = "each-chord-once",
  moduleRequests,
}: CreateChordProgressionPartsOptions<T>): MusicPartConfig[] {
  const normalizedRootNote =
    normalizeRootNoteString(rootNote) ?? DEFAULT_PART_ROOT_NOTE;
  const progressionInput = progression ?? progressionKey;
  const progressionIdentity = progressionKey ?? progressionName;
  const progressionSource: AuthoredChordProgressionConfig["source"] =
    progressionKey
      ? { kind: "built-in", progressionKey }
      : { kind: "custom", name: progressionName };
  const rhythmBeatsPerBar = getRequestedRhythmBeatsPerBar(moduleRequests);
  const automaticRhythm =
    getChordProgressionRhythmProfile(progressionInput)
      .preferredRhythmStarterId === "swing"
      ? "swing"
      : "standard";
  const references: readonly ProgressionPartReference[] =
    chordListMode === "full-song-order"
      ? createFullProgressionPartReferences(
          normalizedRootNote,
          progressionInput,
          progressionSource,
          createEntityId(`progression-${progressionIdentity}`),
          rhythmBeatsPerBar,
        )
      : createUniqueProgressionPartReferences(
          normalizedRootNote,
          progressionInput,
        );

  return references.map((partReference, index) =>
    createPartFromReference({
      moduleRequests,
      partId: createProgressionPartId(progressionIdentity, index),
      partReference,
      automaticRhythm,
    }),
  );
}
