import {
  RHYTHM_PPQ,
  RHYTHM_MAX_BEATS,
  RHYTHM_MIN_BEATS,
  DEFAULT_RHYTHM_RECIPE,
  createRhythmPatternFromRecipe,
  getRhythmRecipeLabel,
  getRhythmTimekeeperOptionLabel,
  isRhythmGroupingValidForBeats,
  rhythmGrooveUsesGrouping,
  type PercussionSampleId,
  type RhythmGroove,
  type RhythmGrouping,
  type RhythmHit,
  type RhythmMeter,
  type RhythmPattern,
  type RhythmRecipe,
  type RhythmSwing,
  type RhythmTimekeeperFeel,
  type RhythmTimekeeperRecipe,
  type RhythmTimekeeperSound,
  type RhythmTimekeeperSubdivision,
} from "@/data/rhythmPresets";
import { isRecord } from "@/utils/session/normalizationPrimitives";

export const DEFAULT_RHYTHM_RECIPE_SELECTION = {
  recipe: DEFAULT_RHYTHM_RECIPE,
  source: "recipe",
} as const satisfies RecipeRhythmSelection;

export interface RecipeRhythmSelection {
  recipe: RhythmRecipe;
  source: "recipe";
}

export type RhythmSelection = RecipeRhythmSelection;

export const DEFAULT_RHYTHM_SELECTION = DEFAULT_RHYTHM_RECIPE_SELECTION;

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

const rhythmTimekeeperSoundIds = {
  hat: true,
  ride: true,
  shaker: true,
} as const satisfies Record<RhythmTimekeeperSound, true>;

const rhythmTimekeeperSubdivisionIds = {
  eighth: true,
  quarter: true,
  sixteenth: true,
} as const satisfies Record<RhythmTimekeeperSubdivision, true>;

const rhythmTimekeeperFeelIds = {
  off: true,
  shuffle: true,
  straight: true,
  triplet: true,
  swing: true,
} as const satisfies Record<RhythmTimekeeperFeel, true>;

const rhythmGrooveIds = {
  backbeat: true,
  bluegrass: true,
  pulse: true,
} as const satisfies Record<RhythmGroove, true>;

const rhythmGroupingIds = {
  "1+1": true,
  "1+2": true,
  "1+3": true,
  "2": true,
  "2+1": true,
  "2+2+1": true,
  "2+2+2": true,
  "2+2+3": true,
  "2+3": true,
  "2+3+3": true,
  "2+4": true,
  "3+1": true,
  "3+2": true,
  "3+3+2": true,
  "3+4": true,
  "4": true,
  "4+3": true,
  auto: true,
} as const satisfies Record<RhythmGrouping, true>;

function hasOwnKey(record: object, value: string) {
  return Object.prototype.hasOwnProperty.call(record, value);
}

function normalizeRecipeField<T extends string>(
  record: Record<T, true>,
  value: unknown,
  fallback: T,
): T {
  return typeof value === "string" && hasOwnKey(record, value)
    ? (value as T)
    : fallback;
}

function normalizeRhythmBeatCount(value: unknown) {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= RHYTHM_MIN_BEATS &&
    value <= RHYTHM_MAX_BEATS
    ? value
    : DEFAULT_RHYTHM_RECIPE.beats;
}

export function normalizeRhythmRecipe(value: unknown): RhythmRecipe {
  if (!isRecord(value)) {
    return DEFAULT_RHYTHM_RECIPE;
  }

  const beats = normalizeRhythmBeatCount(value.beats);
  const rawGrouping = normalizeRecipeField<RhythmGrouping>(
    rhythmGroupingIds,
    value.grouping,
    DEFAULT_RHYTHM_RECIPE.grouping,
  );
  const groove = normalizeRecipeField(
    rhythmGrooveIds,
    value.groove,
    DEFAULT_RHYTHM_RECIPE.groove,
  );
  const grouping =
    rhythmGrooveUsesGrouping(groove) &&
    isRhythmGroupingValidForBeats(beats, rawGrouping)
      ? rawGrouping
      : DEFAULT_RHYTHM_RECIPE.grouping;

  return {
    beats,
    groove,
    grouping,
    timekeeper: normalizeRhythmTimekeeperRecipe(value.timekeeper),
  };
}

function normalizeRhythmTimekeeperRecipe(
  value: unknown,
): RhythmTimekeeperRecipe {
  if (!isRecord(value)) {
    return DEFAULT_RHYTHM_RECIPE.timekeeper;
  }

  const rawSubdivision = normalizeRecipeField<RhythmTimekeeperSubdivision>(
    rhythmTimekeeperSubdivisionIds,
    value.subdivision,
    DEFAULT_RHYTHM_RECIPE.timekeeper.subdivision,
  );
  const rawFeel = normalizeRecipeField<RhythmTimekeeperFeel>(
    rhythmTimekeeperFeelIds,
    value.feel,
    DEFAULT_RHYTHM_RECIPE.timekeeper.feel,
  );
  const legacySoundOff = value.sound === "off";
  const feel = legacySoundOff ? "off" : rawFeel;
  const subdivision =
    feel === "triplet" || feel === "swing" || feel === "shuffle"
      ? "eighth"
      : rawSubdivision;

  return {
    feel,
    sound: legacySoundOff
      ? DEFAULT_RHYTHM_RECIPE.timekeeper.sound
      : normalizeRecipeField(
          rhythmTimekeeperSoundIds,
          value.sound,
          DEFAULT_RHYTHM_RECIPE.timekeeper.sound,
        ),
    subdivision,
  };
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

export function normalizeRhythmSelection(value: unknown): RhythmSelection {
  if (!isRecord(value)) {
    return DEFAULT_RHYTHM_SELECTION;
  }

  if (value.source === "recipe") {
    return {
      recipe: normalizeRhythmRecipe(value.recipe),
      source: "recipe",
    };
  }

  return DEFAULT_RHYTHM_SELECTION;
}

export function getRhythmSelectionRecipe(selection: RhythmSelection) {
  return selection.recipe;
}

export function getRhythmSelectionLabel(selection: RhythmSelection) {
  return getRhythmRecipeLabel(selection.recipe);
}

export function getRhythmSelectionPattern(selection: RhythmSelection) {
  return createRhythmPatternFromRecipe(selection.recipe);
}

export { DEFAULT_RHYTHM_RECIPE, getRhythmTimekeeperOptionLabel };
export type {
  RhythmRecipe,
  RhythmGroove,
  RhythmGrouping,
  RhythmTimekeeperFeel,
  RhythmTimekeeperRecipe,
  RhythmTimekeeperSound,
  RhythmTimekeeperSubdivision,
};
