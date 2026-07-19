import {
  chordProgression,
  flatChordRootDegrees,
  sharpChordRootDegrees,
  type ChordProgression,
  type ChordProgressionChord,
} from "@musodojo/music-theory-data";
import {
  type SavedChordProgression,
  type SavedChordProgressionInput,
} from "@/types/custom-chord-progression";
import { isCustomChordProgressionChordCollectionKey } from "@/data/customChordProgressionChordQualities";
import {
  ensureUniqueIds,
  isRecord,
  normalizeString,
} from "@/utils/session/normalizationPrimitives";

export const CUSTOM_CHORD_PROGRESSION_MAX_BARS = 32;
export const CUSTOM_CHORD_PROGRESSION_MIN_GRID_POSITIONS = 1;
export const CUSTOM_CHORD_PROGRESSION_MAX_GRID_POSITIONS = 8;
export const CUSTOM_CHORD_PROGRESSION_MAX_CHORDS_PER_BAR =
  CUSTOM_CHORD_PROGRESSION_MAX_GRID_POSITIONS;

export const customChordProgressionFlatDegrees = flatChordRootDegrees;
export const customChordProgressionSharpDegrees = sharpChordRootDegrees;

export type CustomChordProgressionDraftChord = Pick<
  ChordProgressionChord,
  "chordCollectionKey" | "degree" | "durationInBars"
>;

export interface CustomChordProgressionDraftBar {
  chords: CustomChordProgressionDraftChord[];
}

const DURATION_EPSILON = 0.000_001;
function valuesAreClose(left: number, right: number) {
  return Math.abs(left - right) <= DURATION_EPSILON;
}

function durationFitsGrid(durationInBars: number, positionCount: number) {
  return valuesAreClose(
    durationInBars * positionCount,
    Math.round(durationInBars * positionCount),
  );
}

export function getCustomProgressionCompatiblePositionCounts(
  bars: readonly CustomChordProgressionDraftBar[],
) {
  return Array.from(
    {
      length:
        CUSTOM_CHORD_PROGRESSION_MAX_GRID_POSITIONS -
        CUSTOM_CHORD_PROGRESSION_MIN_GRID_POSITIONS +
        1,
    },
    (_, index) => CUSTOM_CHORD_PROGRESSION_MIN_GRID_POSITIONS + index,
  ).filter((positionCount) =>
    bars.every((bar) =>
      bar.chords.every((chord) =>
        durationFitsGrid(chord.durationInBars, positionCount),
      ),
    ),
  );
}

export interface CustomProgressionBarPositionSelection {
  bar: CustomChordProgressionDraftBar;
  chordIndex: number;
  inserted: boolean;
}

export function selectCustomProgressionBarPosition(
  bar: CustomChordProgressionDraftBar,
  positionCount: number,
  positionIndex: number,
): CustomProgressionBarPositionSelection | undefined {
  if (
    !Number.isInteger(positionCount) ||
    positionCount < CUSTOM_CHORD_PROGRESSION_MIN_GRID_POSITIONS ||
    positionCount > CUSTOM_CHORD_PROGRESSION_MAX_GRID_POSITIONS ||
    !Number.isInteger(positionIndex) ||
    positionIndex < 0 ||
    positionIndex >= positionCount ||
    !getCustomProgressionCompatiblePositionCounts([bar]).includes(positionCount)
  ) {
    return undefined;
  }

  const positionInBars = positionIndex / positionCount;
  let chordStartInBars = 0;

  for (let chordIndex = 0; chordIndex < bar.chords.length; chordIndex += 1) {
    const chord = bar.chords[chordIndex]!;
    const chordEndInBars = chordStartInBars + chord.durationInBars;

    if (valuesAreClose(positionInBars, chordStartInBars)) {
      return { bar, chordIndex, inserted: false };
    }

    if (
      positionInBars > chordStartInBars + DURATION_EPSILON &&
      positionInBars < chordEndInBars - DURATION_EPSILON
    ) {
      const leadingDuration = positionInBars - chordStartInBars;
      const trailingDuration = chordEndInBars - positionInBars;
      const nextBar = {
        chords: [
          ...bar.chords.slice(0, chordIndex),
          { ...chord, durationInBars: leadingDuration },
          { ...chord, durationInBars: trailingDuration },
          ...bar.chords.slice(chordIndex + 1),
        ],
      };

      return {
        bar: nextBar,
        chordIndex: chordIndex + 1,
        inserted: true,
      };
    }

    chordStartInBars = chordEndInBars;
  }

  return undefined;
}

export function removeCustomProgressionDraftChord(
  bar: CustomChordProgressionDraftBar,
  chordIndex: number,
): CustomChordProgressionDraftBar | undefined {
  if (
    bar.chords.length <= 1 ||
    !Number.isInteger(chordIndex) ||
    chordIndex < 0 ||
    chordIndex >= bar.chords.length
  ) {
    return undefined;
  }

  const removedChord = bar.chords[chordIndex]!;
  const recipientIndex = chordIndex > 0 ? chordIndex - 1 : 1;

  return {
    chords: bar.chords
      .map((chord, index) =>
        index === recipientIndex
          ? {
              ...chord,
              durationInBars:
                chord.durationInBars + removedChord.durationInBars,
            }
          : chord,
      )
      .filter((_, index) => index !== chordIndex),
  };
}

function progressionHasValidBars(progression: ChordProgression) {
  const timing = chordProgression.getTiming(progression);

  return (
    timing.endsOnBarBoundary &&
    timing.bars.length >= 1 &&
    timing.bars.length <= CUSTOM_CHORD_PROGRESSION_MAX_BARS &&
    timing.bars.every((bar) => {
      const draftBar = {
        chords: bar.segments.flatMap((segment) => {
          const chord = progression.chords[segment.eventIndex];

          return chord
            ? [{ ...chord, durationInBars: segment.durationInBars }]
            : [];
        }),
      };

      return (
        draftBar.chords.length <= CUSTOM_CHORD_PROGRESSION_MAX_CHORDS_PER_BAR &&
        getCustomProgressionCompatiblePositionCounts([draftBar]).length > 0
      );
    })
  );
}

function normalizeCustomChordProgressionChord({
  chordCollectionKey,
  degree,
  durationInBars,
}: ChordProgressionChord): ChordProgressionChord {
  return { chordCollectionKey, degree, durationInBars };
}

export function createCustomProgressionFromBars(
  bars: readonly CustomChordProgressionDraftBar[],
): ChordProgression | undefined {
  if (
    bars.length < 1 ||
    bars.length > CUSTOM_CHORD_PROGRESSION_MAX_BARS ||
    bars.some(
      (bar) =>
        bar.chords.length < 1 ||
        bar.chords.length > CUSTOM_CHORD_PROGRESSION_MAX_CHORDS_PER_BAR ||
        !valuesAreClose(
          bar.chords.reduce(
            (duration, chord) => duration + chord.durationInBars,
            0,
          ),
          1,
        ),
    )
  ) {
    return undefined;
  }

  return normalizeCustomChordProgression({
    chords: bars.flatMap((bar) => bar.chords.map((chord) => ({ ...chord }))),
  });
}

export function createCustomProgressionBars(
  progression: ChordProgression,
): CustomChordProgressionDraftBar[] | undefined {
  if (!progressionHasValidBars(progression)) {
    return undefined;
  }

  const timing = chordProgression.getTiming(progression);

  return timing.bars.map((bar) => ({
    chords: bar.segments.flatMap((segment) => {
      const chord = progression.chords[segment.eventIndex];

      return chord
        ? [
            {
              chordCollectionKey: chord.chordCollectionKey,
              degree: chord.degree,
              durationInBars: segment.durationInBars,
            },
          ]
        : [];
    }),
  }));
}

export function normalizeCustomChordProgression(
  value: unknown,
): ChordProgression | undefined {
  const result = chordProgression.parse(value);

  if (!result.success) {
    return undefined;
  }

  const [firstChord, ...remainingChords] = result.value.chords;
  const progression = {
    chords: [
      normalizeCustomChordProgressionChord(firstChord),
      ...remainingChords.map(normalizeCustomChordProgressionChord),
    ],
  } satisfies ChordProgression;

  if (
    !progression.chords.every((chord) =>
      isCustomChordProgressionChordCollectionKey(chord.chordCollectionKey),
    ) ||
    !progressionHasValidBars(progression)
  ) {
    return undefined;
  }

  return progression;
}

export function normalizeCustomChordProgressionName(value: unknown) {
  return normalizeString(value);
}

export function normalizeSavedChordProgression(
  value: unknown,
): SavedChordProgression | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const id = normalizeString(value.id);
  const definitionResult = chordProgression.parseDefinition({
    name: value.name,
    progression: value.progression,
  });

  if (!id || !definitionResult.success) {
    return undefined;
  }

  const progression = normalizeCustomChordProgression(
    definitionResult.value.progression,
  );

  return progression
    ? { id, name: definitionResult.value.name, progression }
    : undefined;
}

export function normalizeSavedChordProgressions(
  value: unknown,
): SavedChordProgression[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const progressions = ensureUniqueIds(
    value
      .map(normalizeSavedChordProgression)
      .filter(
        (progression): progression is SavedChordProgression =>
          progression !== undefined,
      ),
  );
  const usedNames = new Set<string>();
  const uniqueProgressions = progressions.filter((progression) => {
    const nameKey = normalizeChordProgressionNameForComparison(
      progression.name,
    );

    if (usedNames.has(nameKey)) {
      return false;
    }

    usedNames.add(nameKey);
    return true;
  });

  return uniqueProgressions.length > 0 ? uniqueProgressions : undefined;
}

export function normalizeSavedChordProgressionInput(
  value: SavedChordProgressionInput,
): SavedChordProgressionInput | undefined {
  const definitionResult = chordProgression.parseDefinition(value);

  if (!definitionResult.success) {
    return undefined;
  }

  const progression = normalizeCustomChordProgression(
    definitionResult.value.progression,
  );

  return progression
    ? { name: definitionResult.value.name, progression }
    : undefined;
}

export function normalizeChordProgressionNameForComparison(name: string) {
  return name.trim().toLocaleLowerCase();
}

export function savedChordProgressionNameIsAvailable(
  progressions: readonly SavedChordProgression[],
  name: string,
  excludedId?: string,
) {
  const nameKey = normalizeChordProgressionNameForComparison(name);

  return !progressions.some(
    (progression) =>
      progression.id !== excludedId &&
      normalizeChordProgressionNameForComparison(progression.name) === nameKey,
  );
}
