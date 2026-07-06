import {
  chordProgressionCategoryGroups,
  chordProgressions,
  isValidChordProgressionKey,
  type ChordProgressionKey,
} from "@musodojo/music-theory-data";

type LegacyAppChordProgressionKey = "rhythmChanges" | "rhythmChangesB";

export type AppChordProgressionKey =
  ChordProgressionKey | LegacyAppChordProgressionKey;
export type SelectableAppChordProgressionKey = ChordProgressionKey;

const legacyChordProgressionAliases = {
  rhythmChanges: "rhythmChangesA",
  rhythmChangesB: "rhythmChangesBridge",
} as const satisfies Record<LegacyAppChordProgressionKey, ChordProgressionKey>;

export const appChordProgressions = chordProgressions;
export const selectableChordProgressionCategoryGroups =
  chordProgressionCategoryGroups;

export function normalizeAppChordProgressionKey(
  value: string,
): SelectableAppChordProgressionKey | undefined {
  if (isValidChordProgressionKey(value)) {
    return value;
  }

  return Object.hasOwn(legacyChordProgressionAliases, value)
    ? legacyChordProgressionAliases[value as LegacyAppChordProgressionKey]
    : undefined;
}

export function isAppChordProgressionKey(
  value: string,
): value is AppChordProgressionKey {
  return normalizeAppChordProgressionKey(value) !== undefined;
}

function resolveAppChordProgressionKey(
  progressionKey: AppChordProgressionKey,
): SelectableAppChordProgressionKey {
  const normalizedProgressionKey =
    normalizeAppChordProgressionKey(progressionKey);

  if (!normalizedProgressionKey) {
    throw new Error(`Unknown chord progression key: ${progressionKey}`);
  }

  return normalizedProgressionKey;
}

export function getAppChordProgression(progressionKey: AppChordProgressionKey) {
  return chordProgressions[resolveAppChordProgressionKey(progressionKey)];
}

export function getAppChordProgressionInput(
  progressionKey: AppChordProgressionKey,
) {
  return resolveAppChordProgressionKey(progressionKey);
}
