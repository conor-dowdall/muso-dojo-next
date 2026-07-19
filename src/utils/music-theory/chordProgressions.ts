import {
  chordProgression,
  chordProgressionDefinitions,
  rootAndNoteCollection,
  type ChordProgression,
  type ChordProgressionKey,
  type RootNote,
} from "@musodojo/music-theory-data";

export const CHORD_PROGRESSION_BAR_SEPARATOR = " | ";

export type ChordProgressionInput = ChordProgression | ChordProgressionKey;

export interface ChordProgressionDisplayLabels {
  chordLabel: string;
  romanLabel: string;
  titleLabel: string;
}

export interface ChordProgressionDisplaySummary {
  chordNames: string[];
  romanNames: string[];
}

export function getChordProgressionRomanBarLabels(
  progressionOrKey: ChordProgressionInput,
) {
  return chordProgression
    .getRomanSymbolsByBar(progressionOrKey)
    .map((symbols) => symbols.join(" "));
}

export function getChordProgressionDisplaySummary(
  rootNote: RootNote,
  progressionOrKey: ChordProgressionInput,
): ChordProgressionDisplaySummary {
  const resolved = chordProgression.resolve(rootNote, progressionOrKey);

  return {
    chordNames: resolved.bars.map((bar) =>
      bar.segments
        .map((segment) => resolved.events[segment.eventIndex]?.reference)
        .filter((reference) => reference !== undefined)
        .map(
          (reference) =>
            rootAndNoteCollection.getIdentity({
              rootNote: reference.practicalRootNote,
              noteCollectionKey: reference.chordCollectionKey,
            }).label,
        )
        .join(" "),
    ),
    romanNames: getChordProgressionRomanBarLabels(progressionOrKey),
  };
}

export function getChordProgressionDisplayLabels(
  rootNote: RootNote,
  progressionOrKey: ChordProgressionInput,
  title?: string,
): ChordProgressionDisplayLabels {
  const summary = getChordProgressionDisplaySummary(rootNote, progressionOrKey);
  const romanLabel = summary.romanNames.join(CHORD_PROGRESSION_BAR_SEPARATOR);
  const definitionName =
    typeof progressionOrKey === "string"
      ? chordProgressionDefinitions[progressionOrKey].name
      : undefined;

  return {
    chordLabel: summary.chordNames.join(CHORD_PROGRESSION_BAR_SEPARATOR),
    romanLabel,
    titleLabel: title ?? definitionName ?? romanLabel,
  };
}
