import {
  normalizeChromaticIndex,
  noteLabelCollections,
  stringInstruments,
  type MidiNoteNumber,
  type OpenStringMidiNotes,
  type StringInstrumentKey,
} from "@musodojo/music-theory-data";
import {
  type SavedFretboardTuning,
  type SavedFretboardTuningInput,
} from "@/types/custom-fretboard-tuning";
import {
  ensureUniqueIds,
  isRecord,
  normalizeString,
} from "@/utils/session/normalizationPrimitives";

export const CUSTOM_TUNING_MIN_STRINGS = 1;
export const CUSTOM_TUNING_MAX_STRINGS = 12;
export const CUSTOM_TUNING_MIN_MIDI = 0;
export const CUSTOM_TUNING_MAX_MIDI = 127;

export function conventionalToFretboardTuning(
  openMidiNotes: readonly number[],
) {
  return [...openMidiNotes].reverse();
}

export function fretboardToConventionalTuning(tuning: readonly number[]) {
  return [...tuning].reverse();
}

export function formatCustomOpenStringNotes(openMidiNotes: readonly number[]) {
  return openMidiNotes
    .map(
      (note) =>
        noteLabelCollections.noteNamesFlat.labels[
          normalizeChromaticIndex(note)
        ],
    )
    .join(" ");
}

export function normalizeCustomTuningNotes(
  value: unknown,
): OpenStringMidiNotes | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const notes = value
    .filter((note): note is number => Number.isFinite(note))
    .slice(0, CUSTOM_TUNING_MAX_STRINGS)
    .map((note) =>
      Math.min(
        CUSTOM_TUNING_MAX_MIDI,
        Math.max(CUSTOM_TUNING_MIN_MIDI, Math.round(note)),
      ),
    );

  const midiNotes = notes.filter(isMidiNoteNumber);
  const [firstNote, ...remainingNotes] = midiNotes;

  return firstNote !== undefined &&
    midiNotes.length >= CUSTOM_TUNING_MIN_STRINGS
    ? [firstNote, ...remainingNotes]
    : undefined;
}

function isMidiNoteNumber(value: number): value is MidiNoteNumber {
  return (
    Number.isInteger(value) &&
    value >= CUSTOM_TUNING_MIN_MIDI &&
    value <= CUSTOM_TUNING_MAX_MIDI
  );
}

export function normalizeCustomTuningName(value: unknown) {
  return normalizeString(value);
}

function normalizeStringInstrumentKey(
  value: unknown,
): StringInstrumentKey | undefined {
  return typeof value === "string" && value in stringInstruments
    ? (value as StringInstrumentKey)
    : undefined;
}

export function normalizeSavedFretboardTuning(
  value: unknown,
): SavedFretboardTuning | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const id = normalizeString(value.id);
  const instrument = normalizeStringInstrumentKey(value.instrument);
  const name = normalizeCustomTuningName(value.name);
  const openMidiNotes = normalizeCustomTuningNotes(value.openMidiNotes);

  return id && instrument && name && openMidiNotes
    ? { id, instrument, name, openMidiNotes }
    : undefined;
}

export function normalizeSavedFretboardTunings(
  value: unknown,
): SavedFretboardTuning[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const tunings = ensureUniqueIds(
    value
      .map(normalizeSavedFretboardTuning)
      .filter((tuning): tuning is SavedFretboardTuning => tuning !== undefined),
  );
  const usedNames = new Set<string>();
  const uniqueTunings = tunings.filter((tuning) => {
    const nameKey = `${tuning.instrument}:${normalizeTuningNameForComparison(
      tuning.name,
    )}`;

    if (usedNames.has(nameKey)) {
      return false;
    }

    usedNames.add(nameKey);
    return true;
  });

  return uniqueTunings.length > 0 ? uniqueTunings : undefined;
}

export function normalizeSavedFretboardTuningInput(
  value: SavedFretboardTuningInput,
): SavedFretboardTuningInput | undefined {
  const instrument = normalizeStringInstrumentKey(value.instrument);
  const name = normalizeCustomTuningName(value.name);
  const openMidiNotes = normalizeCustomTuningNotes(value.openMidiNotes);

  return instrument && name && openMidiNotes
    ? { instrument, name, openMidiNotes }
    : undefined;
}

export function normalizeTuningNameForComparison(name: string) {
  return name.trim().toLocaleLowerCase();
}

export function savedTuningNameIsAvailable(
  tunings: readonly SavedFretboardTuning[],
  instrument: StringInstrumentKey,
  name: string,
  excludedId?: string,
) {
  const nameKey = normalizeTuningNameForComparison(name);

  return !tunings.some(
    (tuning) =>
      tuning.id !== excludedId &&
      tuning.instrument === instrument &&
      normalizeTuningNameForComparison(tuning.name) === nameKey,
  );
}

export function tuningNotesAreEqual(
  left: readonly number[] | undefined,
  right: readonly number[] | undefined,
) {
  return (
    left !== undefined &&
    right !== undefined &&
    left.length === right.length &&
    left.every((note, index) => note === right[index])
  );
}
