import {
  chordProgressionCategoryGroups,
  chordProgressions,
  isValidChordProgressionKey,
  type ChordProgressionKey,
} from "@musodojo/music-theory-data";

export type AppChordProgressionKey = ChordProgressionKey;
export type SelectableAppChordProgressionKey = ChordProgressionKey;

export const appChordProgressions = chordProgressions;
export const selectableChordProgressionCategoryGroups =
  chordProgressionCategoryGroups;

export function normalizeAppChordProgressionKey(
  value: string,
): SelectableAppChordProgressionKey | undefined {
  return isValidChordProgressionKey(value) ? value : undefined;
}

export function isAppChordProgressionKey(
  value: string,
): value is AppChordProgressionKey {
  return normalizeAppChordProgressionKey(value) !== undefined;
}

function resolveAppChordProgressionKey(
  progressionKey: AppChordProgressionKey,
): SelectableAppChordProgressionKey {
  if (!isValidChordProgressionKey(progressionKey)) {
    throw new Error(`Unknown chord progression key: ${progressionKey}`);
  }

  return progressionKey;
}

export function getAppChordProgression(progressionKey: AppChordProgressionKey) {
  return chordProgressions[resolveAppChordProgressionKey(progressionKey)];
}

export function getAppChordProgressionInput(
  progressionKey: AppChordProgressionKey,
) {
  return resolveAppChordProgressionKey(progressionKey);
}
