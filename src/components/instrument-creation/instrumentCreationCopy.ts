import {
  stringInstruments,
  stringInstrumentTunings,
} from "@musodojo/music-theory-data";
import { keyboardRanges } from "@/data/keyboard/ranges";
import { DISPLAY_VALUE_SEPARATOR } from "@/utils/valueSummary";
import {
  formatKeyboardMidiRange,
  formatKeyboardRangeNoteNames,
} from "./options";
import {
  type FretboardInstrumentSelection,
  type KeyboardInstrumentSelection,
} from "./instrumentCreationConfig";

export function formatKeyboardCreationSummary(
  selection: KeyboardInstrumentSelection,
) {
  const range =
    selection.range === "custom" ? undefined : keyboardRanges[selection.range];
  const rangeTitle = range?.title ?? "Custom Range";
  const rangeNotes = range
    ? formatKeyboardRangeNoteNames(range.midiRangeNoteNames)
    : formatKeyboardMidiRange(selection.midiRange);

  return `${rangeTitle}${DISPLAY_VALUE_SEPARATOR}${rangeNotes}`;
}

export function formatFretRange([start, end]: readonly [number, number]) {
  return `Frets ${start} to ${end}`;
}

export function formatFretboardCreationSummary(
  selection: FretboardInstrumentSelection,
) {
  return [
    ...getFretboardSetupSummaryParts(selection),
    formatFretRange(selection.fretRange),
  ].join(DISPLAY_VALUE_SEPARATOR);
}

function getFretboardSetupSummaryParts(
  selection: FretboardInstrumentSelection,
) {
  return [
    stringInstruments[selection.instrument].primaryName,
    stringInstrumentTunings[selection.tuningKey].primaryName,
    selection.handedness === "left" ? "Left-Handed" : undefined,
  ].filter(Boolean);
}

export function formatKeyboardDefaultSetupSummary() {
  return "Keyboard";
}

export function formatFretboardDefaultSetupSummary(
  selection: FretboardInstrumentSelection,
) {
  return getFretboardSetupSummaryParts(selection).join(DISPLAY_VALUE_SEPARATOR);
}
