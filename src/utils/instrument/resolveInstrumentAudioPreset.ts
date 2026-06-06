import { type StringInstrumentKey } from "@musodojo/music-theory-data";
import { isAudioPresetId } from "@/audio/presets";
import { type AudioPresetId } from "@/audio/types";
import { type InstrumentType } from "@/types/session";

const defaultInstrumentAudioPresetIds = {
  fretboard: "plucked-string",
  keyboard: "piano",
} as const satisfies Record<InstrumentType, AudioPresetId>;

const defaultFretboardInstrumentAudioPresetIds = {
  guitar: "plucked-string",
  bassGuitar: "picked-bass",
  mandolin: "mandolin",
  ukulele: "plucked-string",
  violin: "bowed-strings",
  viola: "bowed-strings",
  cello: "bowed-strings",
  doubleBass: "bowed-strings",
} as const satisfies Record<StringInstrumentKey, AudioPresetId>;

type DefaultFretboardInstrumentKey =
  keyof typeof defaultFretboardInstrumentAudioPresetIds;

export interface InstrumentAudioPresetContext {
  fretboardInstrument?: StringInstrumentKey;
}

function isDefaultFretboardInstrumentKey(
  value: unknown,
): value is DefaultFretboardInstrumentKey {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(
      defaultFretboardInstrumentAudioPresetIds,
      value,
    )
  );
}

export function getDefaultInstrumentAudioPresetId(
  type: InstrumentType,
  context?: InstrumentAudioPresetContext,
) {
  if (
    type === "fretboard" &&
    isDefaultFretboardInstrumentKey(context?.fretboardInstrument)
  ) {
    return defaultFretboardInstrumentAudioPresetIds[
      context.fretboardInstrument
    ];
  }

  return defaultInstrumentAudioPresetIds[type];
}

export function resolveInstrumentAudioPresetId(
  type: InstrumentType,
  value: unknown,
  context?: InstrumentAudioPresetContext,
): AudioPresetId {
  if (!isAudioPresetId(value)) {
    return getDefaultInstrumentAudioPresetId(type, context);
  }

  return value;
}

export function normalizeInstrumentAudioPresetId(
  type: InstrumentType,
  value: unknown,
  context?: InstrumentAudioPresetContext,
) {
  const presetId = resolveInstrumentAudioPresetId(type, value, context);

  return presetId === getDefaultInstrumentAudioPresetId(type, context)
    ? undefined
    : presetId;
}
