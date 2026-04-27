import {
  guitarTuningGroups as guitarTuningGroupData,
  stringInstrumentGroupKeys,
  stringInstrumentGroups,
  stringInstrumentTuningKeysByInstrument,
  stringInstruments,
  type StringInstrumentKey,
  type StringInstrumentTuning,
  type StringInstrumentTuningKey,
} from "@musodojo/music-theory-data";
import {
  fretboardThemes,
  type FretboardThemeName,
} from "@/data/fretboard/themes";
import {
  keyboardRanges,
  type KeyboardRangeName,
  type KeyboardMidiRangeNoteNames,
} from "@/data/keyboard/ranges";
import { keyboardThemes, type KeyboardThemeName } from "@/data/keyboard/themes";

export type AddableMusicGroupItemType = "keyboard" | "fretboard";

export interface DialogOption<T extends string> {
  id: T;
  title: string;
}

interface FretboardInstrumentGroup {
  title: string;
  options: readonly DialogOption<StringInstrumentKey>[];
}

export interface FretboardTuningGroup {
  title?: string;
  tuningKeys: readonly StringInstrumentTuningKey[];
}

export const addableMusicGroupOptions = [
  {
    id: "keyboard",
    title: "Keyboard",
  },
  {
    id: "fretboard",
    title: "Fretboard",
  },
] as const satisfies readonly DialogOption<AddableMusicGroupItemType>[];

function getFretboardInstrumentOption(
  instrumentId: StringInstrumentKey,
): DialogOption<StringInstrumentKey> {
  const instrument = stringInstruments[instrumentId];

  return {
    id: instrumentId,
    title: instrument.primaryName,
  };
}

const guitarAndBassInstrumentGroup: FretboardInstrumentGroup = {
  title: "Guitar & Bass",
  options: [
    getFretboardInstrumentOption("guitar"),
    getFretboardInstrumentOption("bassGuitar"),
  ],
};

export const fretboardInstrumentGroups: readonly FretboardInstrumentGroup[] = [
  guitarAndBassInstrumentGroup,
  ...stringInstrumentGroupKeys
    .filter((groupKey) => groupKey !== "guitar" && groupKey !== "bass")
    .map((groupKey) => {
      const group = stringInstrumentGroups[groupKey];

      return {
        title: group.displayName,
        options: group.instrumentKeys.map(getFretboardInstrumentOption),
      };
    }),
];

const guitarTuningGroups: readonly FretboardTuningGroup[] = Object.values(
  guitarTuningGroupData,
).map((group) => ({
  title: group.displayName,
  tuningKeys: group.tuningKeys,
}));

export const fretboardThemeOptions = Object.keys(
  fretboardThemes,
) as FretboardThemeName[];
export const keyboardRangeOptions = Object.keys(
  keyboardRanges,
) as KeyboardRangeName[];
export const keyboardThemeOptions = Object.keys(
  keyboardThemes,
) as KeyboardThemeName[];

export function formatOpenStringNotes(tuning: StringInstrumentTuning) {
  return tuning.openNoteNames.join(" ");
}

export function formatKeyboardRangeNoteNames([
  startNoteName,
  endNoteName,
]: KeyboardMidiRangeNoteNames) {
  return `${startNoteName} to ${endNoteName}`;
}

export function getFretboardTuningGroups(
  instrumentId: StringInstrumentKey,
): readonly FretboardTuningGroup[] {
  if (instrumentId === "guitar") {
    return guitarTuningGroups;
  }

  return [
    {
      tuningKeys: stringInstrumentTuningKeysByInstrument[instrumentId],
    },
  ];
}
