export const RHYTHM_PPQ = 480;

export type PercussionSampleId =
  | "metronome-click"
  | "kick"
  | "snare"
  | "side-stick"
  | "closed-hat"
  | "pedal-hat"
  | "open-hat"
  | "ride"
  | "crash"
  | "tambourine"
  | "shaker"
  | "claves"
  | "high-woodblock"
  | "low-woodblock";

export interface RhythmMeter {
  beatUnit: 4 | 8;
  beats: number;
}

export interface RhythmSwing {
  ratio: number;
  unitTicks: number;
}

export interface RhythmHit {
  atTicks: number;
  sampleId: PercussionSampleId;
  velocity?: number;
}

export interface RhythmPattern {
  cycleTicks: number;
  hits: readonly RhythmHit[];
  meter: RhythmMeter;
  ppq: typeof RHYTHM_PPQ;
  swing?: RhythmSwing;
}

export type RhythmTimekeeperSound = "off" | "hat" | "ride" | "shaker";
export type RhythmTimekeeperSubdivision = "quarter" | "eighth" | "sixteenth";
export type RhythmTimekeeperFeel = "straight" | "triplet" | "swing";

export interface RhythmTimekeeperRecipe {
  feel: RhythmTimekeeperFeel;
  sound: RhythmTimekeeperSound;
  subdivision: RhythmTimekeeperSubdivision;
}

export interface RhythmRecipe {
  beats: number;
  timekeeper: RhythmTimekeeperRecipe;
}

export interface RhythmRecipeOption<T extends string> {
  description: string;
  id: T;
  label: string;
}

const Q = RHYTHM_PPQ;
const E = RHYTHM_PPQ / 2;
const SIXTEENTH = RHYTHM_PPQ / 4;

export const RHYTHM_MIN_BEATS = 2;
export const RHYTHM_MAX_BEATS = 12;

export const rhythmTimekeeperSoundOptions = [
  {
    id: "off",
    label: "Off",
    description: "No timekeeping percussion lane.",
  },
  {
    id: "hat",
    label: "Hat",
    description: "A closed hi-hat timekeeper.",
  },
  {
    id: "ride",
    label: "Ride",
    description: "A lighter cymbal timekeeper.",
  },
  {
    id: "shaker",
    label: "Shaker",
    description: "A soft noise texture.",
  },
] as const satisfies readonly RhythmRecipeOption<RhythmTimekeeperSound>[];

export const rhythmTimekeeperSubdivisionOptions = [
  {
    id: "quarter",
    label: "Quarter",
    description: "One timekeeper hit per quarter note.",
  },
  {
    id: "eighth",
    label: "Eighth",
    description: "Two timekeeper hits per quarter note.",
  },
  {
    id: "sixteenth",
    label: "Sixteenth",
    description: "Four timekeeper hits per quarter note.",
  },
] as const satisfies readonly RhythmRecipeOption<RhythmTimekeeperSubdivision>[];

export const rhythmTimekeeperFeelOptions = [
  {
    id: "straight",
    label: "Straight",
    description: "Even subdivisions.",
  },
  {
    id: "triplet",
    label: "Triplet",
    description: "Triplet subdivisions.",
  },
  {
    id: "swing",
    label: "Swing",
    description: "Soft swung offbeats leading into the pulse.",
  },
] as const satisfies readonly RhythmRecipeOption<RhythmTimekeeperFeel>[];

export const rhythmTimekeeperOptions = {
  feel: rhythmTimekeeperFeelOptions,
  sound: rhythmTimekeeperSoundOptions,
  subdivision: rhythmTimekeeperSubdivisionOptions,
} as const;

export const DEFAULT_RHYTHM_RECIPE = {
  beats: 4,
  timekeeper: {
    feel: "straight",
    sound: "hat",
    subdivision: "eighth",
  },
} as const satisfies RhythmRecipe;

interface RhythmMeterSpec {
  beatCount: number;
  beatTicks: number;
  cycleTicks: number;
  meter: RhythmMeter;
}

const timekeeperSamples = {
  off: undefined,
  hat: {
    sampleId: "closed-hat",
  },
  ride: {
    sampleId: "ride",
  },
  shaker: {
    sampleId: "shaker",
  },
} as const satisfies Record<
  RhythmTimekeeperSound,
  { sampleId: PercussionSampleId } | undefined
>;

function hit(
  atTicks: number,
  sampleId: PercussionSampleId,
  velocity?: number,
): RhythmHit {
  return {
    atTicks,
    sampleId,
    ...(velocity === undefined ? {} : { velocity }),
  };
}

function getOptionLabel(
  options: readonly { id: string; label: string }[],
  id: string,
) {
  return options.find((option) => option.id === id)?.label ?? id;
}

export function getRhythmTimekeeperOptionLabel<
  T extends keyof RhythmTimekeeperRecipe,
>(category: T, timekeeper: RhythmTimekeeperRecipe) {
  return getOptionLabel(
    rhythmTimekeeperOptions[category],
    timekeeper[category],
  );
}

function addHit(
  hits: RhythmHit[],
  cycleTicks: number,
  atTicks: number,
  sampleId: PercussionSampleId,
  velocity: number,
) {
  if (atTicks < 0 || atTicks >= cycleTicks) {
    return;
  }

  const existing = hits.find(
    (candidate) =>
      candidate.atTicks === atTicks && candidate.sampleId === sampleId,
  );

  if (existing) {
    existing.velocity = Math.max(existing.velocity ?? 0, velocity);
    return;
  }

  hits.push(hit(atTicks, sampleId, velocity));
}

function createRhythmMeterSpec(beats: number): RhythmMeterSpec {
  return {
    beatCount: beats,
    beatTicks: Q,
    cycleTicks: beats * Q,
    meter: { beats, beatUnit: 4 },
  };
}

function addCoreBeatHits(hits: RhythmHit[], spec: RhythmMeterSpec) {
  const addKick = (atTicks: number, velocity = 0.78) =>
    addHit(hits, spec.cycleTicks, atTicks, "kick", velocity);
  const addSnare = (atTicks: number, velocity = 0.68) =>
    addHit(hits, spec.cycleTicks, atTicks, "snare", velocity);

  addKick(0, 0.9);

  if (spec.beatCount === 2) {
    addSnare(Q, 0.62);
    return;
  }

  if (spec.beatCount === 3) {
    addSnare(Q, 0.5);
    addSnare(2 * Q, 0.54);
    return;
  }

  addKick(Math.floor(spec.beatCount / 2) * Q, 0.68);
  addSnare(Q, 0.66);
  addSnare((spec.beatCount - 1) * Q, 0.72);
}

function isTimekeeperAnchor(spec: RhythmMeterSpec, atTicks: number) {
  return (
    atTicks === 0 ||
    (spec.beatCount >= 4 && atTicks === Math.floor(spec.beatCount / 2) * Q)
  );
}

function getStraightTimekeeperVelocity(
  spec: RhythmMeterSpec,
  atTicks: number,
  index: number,
  subdivision: RhythmTimekeeperSubdivision,
) {
  if (isTimekeeperAnchor(spec, atTicks)) {
    return 0.54;
  }

  const isBeat = atTicks % spec.beatTicks === 0;

  if (subdivision === "sixteenth") {
    return isBeat ? 0.34 : index % 2 === 0 ? 0.28 : 0.22;
  }

  return isBeat ? 0.42 : 0.32;
}

function getStraightSubdivisionTicks(subdivision: RhythmTimekeeperSubdivision) {
  switch (subdivision) {
    case "quarter":
      return Q;
    case "eighth":
      return E;
    case "sixteenth":
      return SIXTEENTH;
  }
}

function addStraightTimekeeperHits(
  hits: RhythmHit[],
  spec: RhythmMeterSpec,
  sampleId: PercussionSampleId,
  subdivision: RhythmTimekeeperSubdivision,
) {
  const stepTicks = getStraightSubdivisionTicks(subdivision);
  const count = Math.ceil(spec.cycleTicks / stepTicks);

  Array.from({ length: count }, (_, index) => index * stepTicks).forEach(
    (atTicks, index) => {
      addHit(
        hits,
        spec.cycleTicks,
        atTicks,
        sampleId,
        getStraightTimekeeperVelocity(spec, atTicks, index, subdivision),
      );
    },
  );
}

function addTripletTimekeeperHits(
  hits: RhythmHit[],
  spec: RhythmMeterSpec,
  sampleId: PercussionSampleId,
  subdivision: RhythmTimekeeperSubdivision,
) {
  if (subdivision === "quarter") {
    addStraightTimekeeperHits(hits, spec, sampleId, subdivision);
    return;
  }

  const stepTicks = subdivision === "eighth" ? Q / 3 : Q / 6;
  const count = Math.ceil(spec.cycleTicks / stepTicks);

  Array.from({ length: count }, (_, index) => index * stepTicks).forEach(
    (atTicks) => {
      const isBeat = atTicks % Q === 0;
      const velocity = isTimekeeperAnchor(spec, atTicks)
        ? 0.5
        : isBeat
          ? 0.34
          : subdivision === "sixteenth"
            ? 0.18
            : 0.26;
      addHit(hits, spec.cycleTicks, atTicks, sampleId, velocity);
    },
  );
}

function addSwingTimekeeperHits(
  hits: RhythmHit[],
  spec: RhythmMeterSpec,
  sampleId: PercussionSampleId,
  subdivision: RhythmTimekeeperSubdivision,
) {
  if (subdivision === "quarter") {
    addStraightTimekeeperHits(hits, spec, sampleId, subdivision);
    return;
  }

  const pairTicks = subdivision === "sixteenth" ? E : Q;
  const offbeatTicks = Math.round((pairTicks * 2) / 3);
  const count = Math.ceil(spec.cycleTicks / pairTicks);

  Array.from({ length: count }, (_, index) => index * pairTicks).forEach(
    (atTicks, index) => {
      const isBeat = atTicks % Q === 0;
      addHit(
        hits,
        spec.cycleTicks,
        atTicks,
        sampleId,
        isTimekeeperAnchor(spec, atTicks)
          ? 0.52
          : isBeat
            ? 0.4
            : index % 2 === 0
              ? 0.34
              : 0.3,
      );
      addHit(
        hits,
        spec.cycleTicks,
        atTicks + offbeatTicks,
        sampleId,
        subdivision === "sixteenth" ? 0.2 : 0.24,
      );
    },
  );
}

function addTimekeeperHits(
  hits: RhythmHit[],
  recipe: RhythmRecipe,
  spec: RhythmMeterSpec,
) {
  const sample = timekeeperSamples[recipe.timekeeper.sound];

  if (!sample) {
    return;
  }

  switch (recipe.timekeeper.feel) {
    case "straight":
      addStraightTimekeeperHits(
        hits,
        spec,
        sample.sampleId,
        recipe.timekeeper.subdivision,
      );
      break;
    case "triplet":
      addTripletTimekeeperHits(
        hits,
        spec,
        sample.sampleId,
        recipe.timekeeper.subdivision,
      );
      break;
    case "swing":
      addSwingTimekeeperHits(
        hits,
        spec,
        sample.sampleId,
        recipe.timekeeper.subdivision,
      );
      break;
  }
}

function sortHits(hits: RhythmHit[]) {
  return [...hits].sort((left, right) => {
    if (left.atTicks !== right.atTicks) {
      return left.atTicks - right.atTicks;
    }

    return left.sampleId.localeCompare(right.sampleId);
  });
}

export function createRhythmPatternFromRecipe(
  recipe: RhythmRecipe,
): RhythmPattern {
  const spec = createRhythmMeterSpec(recipe.beats);
  const hits: RhythmHit[] = [];

  addCoreBeatHits(hits, spec);
  addTimekeeperHits(hits, recipe, spec);

  return {
    cycleTicks: spec.cycleTicks,
    hits: sortHits(hits),
    meter: spec.meter,
    ppq: RHYTHM_PPQ,
  };
}

export function getRhythmRecipeLabel(recipe: RhythmRecipe) {
  const beatLabel = getRhythmBeatCountLabel(recipe.beats);
  const timekeeperLabel = getRhythmTimekeeperLabel(recipe.timekeeper);
  const suffix =
    recipe.timekeeper.sound === "off"
      ? "No Timekeeper"
      : `${timekeeperLabel} Timekeeper`;

  return `${beatLabel} - ${suffix}`;
}

export function getRhythmBeatCountLabel(beats: number) {
  return `${beats} ${beats === 1 ? "Beat" : "Beats"}`;
}

export function getRhythmTimekeeperLabel(timekeeper: RhythmTimekeeperRecipe) {
  if (timekeeper.sound === "off") {
    return "Off";
  }

  const soundLabel = getOptionLabel(
    rhythmTimekeeperSoundOptions,
    timekeeper.sound,
  );
  const subdivisionLabel = getOptionLabel(
    rhythmTimekeeperSubdivisionOptions,
    timekeeper.subdivision,
  );

  if (timekeeper.feel === "straight") {
    return `${soundLabel} ${subdivisionLabel}`;
  }

  const feelLabel = getOptionLabel(
    rhythmTimekeeperFeelOptions,
    timekeeper.feel,
  );
  return `${soundLabel} ${feelLabel} ${subdivisionLabel}`;
}

export function getPercussionRegionId(sampleId: PercussionSampleId) {
  return `percussion-${sampleId}`;
}
