import {
  DEFAULT_KEYBOARD_RANGE,
  keyboardRanges,
  type KeyboardRangeName,
} from "@/data/keyboard/ranges";
import {
  type FretboardInstrumentInstanceConfig,
  type KeyboardInstrumentInstanceConfig,
  type MusicPartConfig,
} from "@/types/session";
import { areRangesEqual } from "@/utils/range/numberRange";
import { isInstrumentPartModule } from "@/utils/session/partModuleTypes";
import {
  type InstrumentCreationRangeContext,
  type KeyboardRangeSelection,
} from "./instrumentCreationConfig";

const DEFAULT_FRET_RANGE = [0, 12] as const;

export type InstrumentCreationRangeContextSignature = readonly [
  keyboardRange: KeyboardRangeSelection | undefined,
  keyboardStartMidi: number | undefined,
  keyboardEndMidi: number | undefined,
  fretboardStartFret: number | undefined,
  fretboardEndFret: number | undefined,
];

// Keep this signature primitive for Zustand selectors; shallow equality should
// ignore unrelated instrument appearance edits.
const emptyRangeContextSignature = [
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
] as const satisfies InstrumentCreationRangeContextSignature;

function getKeyboardRangeName(
  midiRange: readonly [number, number],
): KeyboardRangeName | undefined {
  return (Object.keys(keyboardRanges) as KeyboardRangeName[]).find(
    (rangeName) =>
      areRangesEqual(keyboardRanges[rangeName].midiRange, midiRange),
  );
}

function getKeyboardRangeContext(
  instrument: KeyboardInstrumentInstanceConfig,
): NonNullable<InstrumentCreationRangeContext["keyboard"]> {
  const midiRange =
    instrument.config?.midiRange ??
    keyboardRanges[instrument.range ?? DEFAULT_KEYBOARD_RANGE].midiRange;
  const range: KeyboardRangeSelection =
    getKeyboardRangeName(midiRange) ?? "custom";

  return {
    range,
    midiRange: [...midiRange],
  };
}

function getFretboardRangeContext(
  instrument: FretboardInstrumentInstanceConfig,
): NonNullable<InstrumentCreationRangeContext["fretboard"]> {
  return {
    fretRange: [...(instrument.config?.fretRange ?? DEFAULT_FRET_RANGE)],
  };
}

export function createInstrumentCreationRangeContext(
  parts: readonly MusicPartConfig[],
): InstrumentCreationRangeContext | undefined {
  const context: InstrumentCreationRangeContext = {};

  for (let partIndex = parts.length - 1; partIndex >= 0; partIndex -= 1) {
    const part = parts[partIndex];

    if (!part) {
      continue;
    }

    for (
      let moduleIndex = part.modules.length - 1;
      moduleIndex >= 0;
      moduleIndex -= 1
    ) {
      const partModule = part.modules[moduleIndex];

      if (!isInstrumentPartModule(partModule)) {
        continue;
      }

      if (partModule.instrument.type === "keyboard" && !context.keyboard) {
        context.keyboard = getKeyboardRangeContext(partModule.instrument);
      }

      if (partModule.instrument.type === "fretboard" && !context.fretboard) {
        context.fretboard = getFretboardRangeContext(partModule.instrument);
      }

      if (context.keyboard && context.fretboard) {
        return context;
      }
    }
  }

  return context.keyboard || context.fretboard ? context : undefined;
}

export function createInstrumentCreationRangeContextSignature(
  parts: readonly MusicPartConfig[],
): InstrumentCreationRangeContextSignature {
  const context = createInstrumentCreationRangeContext(parts);

  if (!context) {
    return emptyRangeContextSignature;
  }

  return [
    context.keyboard?.range,
    context.keyboard?.midiRange[0],
    context.keyboard?.midiRange[1],
    context.fretboard?.fretRange[0],
    context.fretboard?.fretRange[1],
  ];
}

export function createInstrumentCreationRangeContextFromSignature(
  signature: InstrumentCreationRangeContextSignature,
): InstrumentCreationRangeContext | undefined {
  const [
    keyboardRange,
    keyboardStartMidi,
    keyboardEndMidi,
    fretboardStartFret,
    fretboardEndFret,
  ] = signature;
  const context: InstrumentCreationRangeContext = {};

  if (
    keyboardRange !== undefined &&
    keyboardStartMidi !== undefined &&
    keyboardEndMidi !== undefined
  ) {
    context.keyboard = {
      range: keyboardRange,
      midiRange: [keyboardStartMidi, keyboardEndMidi],
    };
  }

  if (fretboardStartFret !== undefined && fretboardEndFret !== undefined) {
    context.fretboard = {
      fretRange: [fretboardStartFret, fretboardEndFret],
    };
  }

  return context.keyboard || context.fretboard ? context : undefined;
}
