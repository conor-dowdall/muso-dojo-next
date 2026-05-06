import {
  getChordProgressionChordReferences,
  normalizeRootNoteString,
  type ChordProgressionChordReference,
  type ChordProgressionKey,
} from "@musodojo/music-theory-data";
import {
  createDefaultInstrumentConfig,
  createEntityId,
} from "@/utils/workspace/createWorkspaceEntities";
import { normalizeMusicGroupConfig } from "@/utils/workspace/createWorkspaceConfig";
import {
  type InstrumentCreationConfig,
  type InstrumentType,
  type MusicGroupConfig,
} from "@/types/workspace";

interface CreateChordProgressionGroupsOptions {
  rootNote: string;
  progressionKey: ChordProgressionKey;
  instrumentType: InstrumentType;
  instrumentSettings: InstrumentCreationConfig;
}

function createProgressionGroupId(
  progressionKey: ChordProgressionKey,
  index: number,
) {
  return createEntityId(`group-${progressionKey}-${index + 1}`);
}

function createGroupFromReference({
  groupId,
  instrumentSettings,
  instrumentType,
  reference,
}: {
  groupId: string;
  instrumentSettings: InstrumentCreationConfig;
  instrumentType: InstrumentType;
  reference: ChordProgressionChordReference;
}): MusicGroupConfig {
  const group = normalizeMusicGroupConfig({
    id: groupId,
    rootNote: reference.rootNote,
    noteCollectionKey: reference.noteCollectionKey,
    instruments: [
      createDefaultInstrumentConfig(instrumentType, instrumentSettings),
    ],
  });

  if (!group) {
    throw new Error("Unable to create chord progression group");
  }

  return group;
}

export function createChordProgressionGroups({
  rootNote,
  progressionKey,
  instrumentType,
  instrumentSettings,
}: CreateChordProgressionGroupsOptions): MusicGroupConfig[] {
  const normalizedRootNote = normalizeRootNoteString(rootNote) ?? "C";
  const references = getChordProgressionChordReferences(
    normalizedRootNote,
    progressionKey,
  );

  return references.map((reference, index) =>
    createGroupFromReference({
      groupId: createProgressionGroupId(progressionKey, index),
      instrumentSettings,
      instrumentType,
      reference,
    }),
  );
}
