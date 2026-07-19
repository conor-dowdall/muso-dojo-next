import {
  chordProgression,
  chordProgressionDefinitions,
  getChordProgressionChordDirectRomanSymbol,
  rootAndNoteCollection,
  type ChordProgression,
  type ChordProgressionChord,
  type ChordProgressionKey,
  type RootNote,
} from "@musodojo/music-theory-data";
import { DISPLAY_VALUE_SEPARATOR } from "@/utils/valueSummary";

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

function getChordRomanSymbol(chord: ChordProgressionChord) {
  return (
    chord.analysis?.romanSymbol ??
    getChordProgressionChordDirectRomanSymbol(chord)
  );
}

export function getChordProgressionRomanBarLabels(
  progressionOrKey: ChordProgressionInput,
) {
  const progression =
    typeof progressionOrKey === "string"
      ? chordProgressionDefinitions[progressionOrKey].progression
      : progressionOrKey;
  const timing = chordProgression.getTiming(progressionOrKey);

  return timing.bars.map((bar) =>
    bar.segments
      .map((segment) => progression.chords[segment.eventIndex])
      .filter((chord): chord is ChordProgressionChord => chord !== undefined)
      .map(getChordRomanSymbol)
      .join(" "),
  );
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
    romanNames: resolved.bars.map((bar) =>
      bar.segments
        .map((segment) => resolved.events[segment.eventIndex]?.romanSymbol)
        .filter((romanSymbol) => romanSymbol !== undefined)
        .join(" "),
    ),
  };
}

export function getChordProgressionDisplayLabels(
  rootNote: RootNote,
  progressionOrKey: ChordProgressionInput,
  title?: string,
): ChordProgressionDisplayLabels {
  const summary = getChordProgressionDisplaySummary(rootNote, progressionOrKey);
  const romanLabel = summary.romanNames.join(DISPLAY_VALUE_SEPARATOR);
  const definitionName =
    typeof progressionOrKey === "string"
      ? chordProgressionDefinitions[progressionOrKey].name
      : undefined;

  return {
    chordLabel: summary.chordNames.join(DISPLAY_VALUE_SEPARATOR),
    romanLabel,
    titleLabel: title ?? definitionName ?? romanLabel,
  };
}
