import {
  getChordProgressionSongChordReferences,
  getChordProgressionUniqueChordReferences,
  normalizeRootNoteString,
  type ChordProgressionChordReference,
  type ChordProgressionKey,
} from "@musodojo/music-theory-data";
import {
  createDefaultPartModuleConfig,
  createEntityId,
} from "@/utils/session/createSessionEntities";
import { normalizeMusicPartConfig } from "@/utils/session/normalizeMusicPartConfig";
import {
  type ChordProgressionChordListMode,
  type MusicPartConfig,
  type PartModuleCreationRequest,
  type PartModuleType,
} from "@/types/session";
import { DEFAULT_PART_ROOT_NOTE } from "@/utils/session/sessionDefaults";

type CreateChordProgressionPartsOptions<
  T extends PartModuleType = PartModuleType,
> = {
  rootNote: string;
  progressionKey: ChordProgressionKey;
  chordListMode?: ChordProgressionChordListMode;
  initialModule: PartModuleCreationRequest<T>;
};

function createProgressionPartId(
  progressionKey: ChordProgressionKey,
  index: number,
) {
  return createEntityId(`part-${progressionKey}-${index + 1}`);
}

function createPartFromReference<T extends PartModuleType>({
  initialModule,
  partId,
  reference,
}: {
  initialModule: PartModuleCreationRequest<T>;
  partId: string;
  reference: ChordProgressionChordReference;
}): MusicPartConfig {
  const part = normalizeMusicPartConfig({
    id: partId,
    rootNote: reference.rootNote,
    noteCollectionKey: reference.noteCollectionKey,
    modules: [createDefaultPartModuleConfig(initialModule)],
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
  initialModule,
}: CreateChordProgressionPartsOptions<T>): MusicPartConfig[] {
  const normalizedRootNote =
    normalizeRootNoteString(rootNote) ?? DEFAULT_PART_ROOT_NOTE;
  const references =
    chordListMode === "full-song-order"
      ? getChordProgressionSongChordReferences(
          normalizedRootNote,
          progressionKey,
        )
      : getChordProgressionUniqueChordReferences(
          normalizedRootNote,
          progressionKey,
        );

  return references.map((reference, index) =>
    createPartFromReference({
      initialModule,
      partId: createProgressionPartId(progressionKey, index),
      reference,
    }),
  );
}
