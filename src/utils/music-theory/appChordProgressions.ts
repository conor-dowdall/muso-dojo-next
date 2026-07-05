import {
  chordProgressionCategoryGroups,
  chordProgressions,
  isValidChordProgressionKey,
  type ChordProgressionKey,
} from "@musodojo/music-theory-data";

export type AppChordProgressionKey =
  | ChordProgressionKey
  | "rhythmChangesA"
  | "rhythmChangesB";

export type SelectableAppChordProgressionKey =
  | Exclude<ChordProgressionKey, "rhythmChanges">
  | "rhythmChangesA"
  | "rhythmChangesB";

interface AppChordProgressionCategoryGroup {
  category: string;
  name: string;
  progressionKeys: readonly SelectableAppChordProgressionKey[];
}

interface BuiltInChordProgressionCategoryGroup {
  category: string;
  name: string;
  progressionKeys: readonly ChordProgressionKey[];
}

const RHYTHM_CHANGES_A_CHORD_COUNT = 16;
const RHYTHM_CHANGES_BRIDGE_START_INDEX = 32;
const RHYTHM_CHANGES_BRIDGE_CHORD_COUNT = 4;

const rhythmChangesChords = chordProgressions.rhythmChanges.chords;

const appSpecificChordProgressions = {
  rhythmChangesA: {
    commonName: "Rhythm Changes A Section",
    category: "jazz",
    chords: rhythmChangesChords.slice(0, RHYTHM_CHANGES_A_CHORD_COUNT),
  },
  rhythmChangesB: {
    commonName: "Rhythm Changes Bridge",
    category: "jazz",
    chords: rhythmChangesChords.slice(
      RHYTHM_CHANGES_BRIDGE_START_INDEX,
      RHYTHM_CHANGES_BRIDGE_START_INDEX + RHYTHM_CHANGES_BRIDGE_CHORD_COUNT,
    ),
  },
} as const;

export const appChordProgressions = {
  ...chordProgressions,
  ...appSpecificChordProgressions,
};

export const selectableChordProgressionCategoryGroups: readonly AppChordProgressionCategoryGroup[] =
  (
    chordProgressionCategoryGroups as readonly BuiltInChordProgressionCategoryGroup[]
  ).map((group) => ({
    category: group.category,
    name: group.name,
    progressionKeys: group.progressionKeys.flatMap(
      (progressionKey): SelectableAppChordProgressionKey[] =>
        progressionKey === "rhythmChanges"
          ? ["rhythmChangesA", "rhythmChangesB"]
          : [progressionKey],
    ),
  }));

export function isAppChordProgressionKey(
  value: string,
): value is AppChordProgressionKey {
  return (
    isValidChordProgressionKey(value) ||
    Object.hasOwn(appSpecificChordProgressions, value)
  );
}

export function getAppChordProgression(progressionKey: AppChordProgressionKey) {
  return isValidChordProgressionKey(progressionKey)
    ? chordProgressions[progressionKey]
    : appSpecificChordProgressions[progressionKey];
}

export function getAppChordProgressionInput(
  progressionKey: AppChordProgressionKey,
) {
  return isValidChordProgressionKey(progressionKey)
    ? progressionKey
    : appSpecificChordProgressions[progressionKey];
}
