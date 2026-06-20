import {
  RHYTHM_PPQ,
  rhythmPresetIds,
  rhythmPresets,
  type PercussionSampleId,
  type RhythmHit,
  type RhythmMeter,
  type RhythmPattern,
  type RhythmPresetId,
  type RhythmSwing,
} from "@/data/rhythmPresets";
import { isRecord } from "@/utils/session/normalizationPrimitives";

export const DEFAULT_RHYTHM_PRESET_ID = "simple-4-4" satisfies RhythmPresetId;

export interface PresetRhythmSelection {
  presetId: RhythmPresetId;
  source: "preset";
}

export interface CustomRhythmSelection {
  basedOnPresetId?: RhythmPresetId;
  name?: string;
  pattern: RhythmPattern;
  source: "custom";
}

export type RhythmSelection = PresetRhythmSelection | CustomRhythmSelection;

export const DEFAULT_RHYTHM_SELECTION = {
  presetId: DEFAULT_RHYTHM_PRESET_ID,
  source: "preset",
} as const satisfies PresetRhythmSelection;

const percussionSampleIds = {
  "closed-hat": true,
  "high-woodblock": true,
  "low-woodblock": true,
  "metronome-click": true,
  "open-hat": true,
  "pedal-hat": true,
  claves: true,
  crash: true,
  kick: true,
  ride: true,
  shaker: true,
  "side-stick": true,
  snare: true,
  tambourine: true,
} as const satisfies Record<PercussionSampleId, true>;

function hasOwnKey(record: object, value: string) {
  return Object.prototype.hasOwnProperty.call(record, value);
}

export function isRhythmPresetId(value: unknown): value is RhythmPresetId {
  return typeof value === "string" && hasOwnKey(rhythmPresets, value);
}

function normalizeRhythmPresetId(value: unknown) {
  return isRhythmPresetId(value) ? value : undefined;
}

function normalizePercussionSampleId(
  value: unknown,
): PercussionSampleId | undefined {
  return typeof value === "string" && hasOwnKey(percussionSampleIds, value)
    ? (value as PercussionSampleId)
    : undefined;
}

function normalizeVelocity(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(1, Math.max(0, value))
    : undefined;
}

function normalizeMeter(value: unknown): RhythmMeter | undefined {
  if (
    !isRecord(value) ||
    typeof value.beats !== "number" ||
    !Number.isInteger(value.beats) ||
    value.beats < 1 ||
    value.beats > 16 ||
    (value.beatUnit !== 4 && value.beatUnit !== 8)
  ) {
    return undefined;
  }

  return {
    beats: value.beats,
    beatUnit: value.beatUnit,
  };
}

function normalizeSwing(value: unknown): RhythmSwing | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  if (
    typeof value.unitTicks !== "number" ||
    !Number.isInteger(value.unitTicks) ||
    value.unitTicks <= 0 ||
    value.unitTicks > RHYTHM_PPQ ||
    typeof value.ratio !== "number" ||
    !Number.isFinite(value.ratio) ||
    value.ratio <= 0.5 ||
    value.ratio >= 0.75
  ) {
    return undefined;
  }

  return {
    ratio: value.ratio,
    unitTicks: value.unitTicks,
  };
}

function normalizeHit(
  value: unknown,
  cycleTicks: number,
): RhythmHit | undefined {
  if (
    !isRecord(value) ||
    typeof value.atTicks !== "number" ||
    !Number.isInteger(value.atTicks) ||
    value.atTicks < 0 ||
    value.atTicks >= cycleTicks
  ) {
    return undefined;
  }

  const sampleId = normalizePercussionSampleId(value.sampleId);

  if (!sampleId) {
    return undefined;
  }

  const velocity = normalizeVelocity(value.velocity);

  return {
    atTicks: value.atTicks,
    sampleId,
    ...(velocity === undefined ? {} : { velocity }),
  };
}

export function normalizeRhythmPattern(
  value: unknown,
): RhythmPattern | undefined {
  if (
    !isRecord(value) ||
    value.ppq !== RHYTHM_PPQ ||
    typeof value.cycleTicks !== "number" ||
    !Number.isInteger(value.cycleTicks) ||
    value.cycleTicks <= 0 ||
    value.cycleTicks > RHYTHM_PPQ * 32 ||
    !Array.isArray(value.hits)
  ) {
    return undefined;
  }

  const meter = normalizeMeter(value.meter);

  if (!meter) {
    return undefined;
  }

  const cycleTicks = value.cycleTicks;
  const hits = value.hits
    .map((hit) => normalizeHit(hit, cycleTicks))
    .filter((hit): hit is RhythmHit => hit !== undefined);

  if (hits.length === 0) {
    return undefined;
  }

  const swing = normalizeSwing(value.swing);

  return {
    cycleTicks,
    hits,
    meter,
    ppq: RHYTHM_PPQ,
    ...(swing ? { swing } : {}),
  };
}

function normalizeCustomRhythmSelection(
  value: Record<string, unknown>,
): CustomRhythmSelection | undefined {
  const pattern = normalizeRhythmPattern(value.pattern);

  if (!pattern) {
    return undefined;
  }

  const basedOnPresetId = normalizeRhythmPresetId(value.basedOnPresetId);
  const name =
    typeof value.name === "string" && value.name.trim()
      ? value.name.trim().slice(0, 80)
      : undefined;

  return {
    ...(basedOnPresetId ? { basedOnPresetId } : {}),
    ...(name ? { name } : {}),
    pattern,
    source: "custom",
  };
}

export function normalizeRhythmSelection(value: unknown): RhythmSelection {
  if (!isRecord(value)) {
    return DEFAULT_RHYTHM_SELECTION;
  }

  if (value.source === "custom") {
    return normalizeCustomRhythmSelection(value) ?? DEFAULT_RHYTHM_SELECTION;
  }

  const presetId = normalizeRhythmPresetId(value.presetId);

  return {
    presetId: presetId ?? DEFAULT_RHYTHM_PRESET_ID,
    source: "preset",
  };
}

export function getRhythmSelectionPresetId(selection: RhythmSelection) {
  return selection.source === "preset"
    ? selection.presetId
    : selection.basedOnPresetId;
}

export function getRhythmSelectionLabel(selection: RhythmSelection) {
  if (selection.source === "custom") {
    return selection.name ?? "Custom Rhythm";
  }

  return rhythmPresets[selection.presetId].label;
}

export function getRhythmSelectionPattern(selection: RhythmSelection) {
  return selection.source === "custom"
    ? selection.pattern
    : rhythmPresets[selection.presetId].pattern;
}

export { rhythmPresetIds, rhythmPresets };
export type { RhythmPresetId };
