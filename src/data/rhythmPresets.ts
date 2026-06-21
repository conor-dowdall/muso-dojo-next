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
export type RhythmGroove = "off" | "kick" | "backbeat" | "sparse";
export type RhythmGrouping = "auto" | "2+3" | "3+2" | "3+4" | "4+3";

export interface RhythmTimekeeperRecipe {
  feel: RhythmTimekeeperFeel;
  sound: RhythmTimekeeperSound;
  subdivision: RhythmTimekeeperSubdivision;
}

export interface RhythmRecipe {
  beats: number;
  groove: RhythmGroove;
  grouping: RhythmGrouping;
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
export const RHYTHM_MAX_BEATS = 8;

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
    label: "1 / Beat",
    description: "One timekeeper hit per beat.",
  },
  {
    id: "eighth",
    label: "2 / Beat",
    description: "Two timekeeper hits per beat.",
  },
  {
    id: "sixteenth",
    label: "4 / Beat",
    description: "Four timekeeper hits per beat.",
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
    label: "3 / Beat",
    description: "Three evenly spaced subdivisions per beat.",
  },
  {
    id: "swing",
    label: "Swing",
    description: "Soft swung offbeats leading into the beat.",
  },
] as const satisfies readonly RhythmRecipeOption<RhythmTimekeeperFeel>[];

export const rhythmTimekeeperOptions = {
  feel: rhythmTimekeeperFeelOptions,
  sound: rhythmTimekeeperSoundOptions,
  subdivision: rhythmTimekeeperSubdivisionOptions,
} as const;

export const rhythmGrooveOptions = [
  {
    id: "off",
    label: "Off",
    description: "No kick or snare foundation.",
  },
  {
    id: "kick",
    label: "Kick",
    description: "Bass drum on every beat.",
  },
  {
    id: "backbeat",
    label: "Backbeat",
    description: "A simple kick and snare foundation.",
  },
  {
    id: "sparse",
    label: "Light",
    description: "A lighter kick and snare outline.",
  },
] as const satisfies readonly RhythmRecipeOption<RhythmGroove>[];

export const rhythmGroupingOptions = [
  {
    id: "auto",
    label: "Auto",
    description: "Use the default grouping for this beat count.",
  },
  {
    id: "3+2",
    label: "3+2",
    description: "Group five beats as three plus two.",
  },
  {
    id: "2+3",
    label: "2+3",
    description: "Group five beats as two plus three.",
  },
  {
    id: "4+3",
    label: "4+3",
    description: "Group seven beats as four plus three.",
  },
  {
    id: "3+4",
    label: "3+4",
    description: "Group seven beats as three plus four.",
  },
] as const satisfies readonly RhythmRecipeOption<RhythmGrouping>[];

export const DEFAULT_RHYTHM_RECIPE = {
  beats: 4,
  groove: "backbeat",
  grouping: "auto",
  timekeeper: {
    feel: "straight",
    sound: "hat",
    subdivision: "eighth",
  },
} as const satisfies RhythmRecipe;

interface RhythmMeterSpec {
  groupStarts: readonly number[];
  groups: readonly number[];
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

const defaultRhythmBeatGroups = {
  2: [2],
  3: [3],
  4: [2, 2],
  5: [3, 2],
  6: [3, 3],
  7: [4, 3],
  8: [4, 4],
} as const satisfies Record<number, readonly number[]>;

const rhythmBeatGroupsByGrouping = {
  "2+3": [2, 3],
  "3+2": [3, 2],
  "3+4": [3, 4],
  "4+3": [4, 3],
} as const satisfies Record<Exclude<RhythmGrouping, "auto">, readonly number[]>;

const rhythmGroupingOptionsByBeatCount: Partial<
  Record<number, readonly RhythmGrouping[]>
> = {
  5: ["auto", "3+2", "2+3"],
  7: ["auto", "4+3", "3+4"],
};

export function getRhythmGroupingOptions(
  beats: number,
): readonly RhythmGrouping[] {
  return rhythmGroupingOptionsByBeatCount[beats] ?? (["auto"] as const);
}

export function getRhythmGroupingOptionLabel(grouping: RhythmGrouping) {
  return getOptionLabel(rhythmGroupingOptions, grouping);
}

export function getRhythmGrooveOptionLabel(groove: RhythmGroove) {
  return getOptionLabel(rhythmGrooveOptions, groove);
}

export function getRhythmGroupingReadout(recipe: RhythmRecipe) {
  const groupingLabel = getRhythmBeatGroups(recipe).join("+");

  return recipe.grouping === "auto" ? `Auto ${groupingLabel}` : groupingLabel;
}

export function isRhythmGroupingValidForBeats(
  beats: number,
  grouping: RhythmGrouping,
) {
  return getRhythmGroupingOptions(beats).includes(grouping);
}

function getRhythmBeatGroups(recipe: RhythmRecipe) {
  if (
    recipe.grouping !== "auto" &&
    isRhythmGroupingValidForBeats(recipe.beats, recipe.grouping)
  ) {
    return rhythmBeatGroupsByGrouping[recipe.grouping];
  }

  return (
    defaultRhythmBeatGroups[
      recipe.beats as keyof typeof defaultRhythmBeatGroups
    ] ?? [recipe.beats]
  );
}

function createRhythmMeterSpec(recipe: RhythmRecipe): RhythmMeterSpec {
  const groups = getRhythmBeatGroups(recipe);
  let currentStart = 0;
  const groupStarts = groups.map((group) => {
    const start = currentStart;
    currentStart += group;
    return start;
  });

  return {
    groupStarts,
    groups,
    beatTicks: Q,
    cycleTicks: recipe.beats * Q,
    meter: { beats: recipe.beats, beatUnit: 4 },
  };
}

function addBackbeatGrooveHits(hits: RhythmHit[], spec: RhythmMeterSpec) {
  const addKick = (atTicks: number, velocity = 0.78) =>
    addHit(hits, spec.cycleTicks, atTicks, "kick", velocity);
  const addSnare = (atTicks: number, velocity = 0.68) =>
    addHit(hits, spec.cycleTicks, atTicks, "snare", velocity);

  addKick(0, 0.9);

  if (spec.groups.length === 1 && spec.groups[0] === 3) {
    addSnare(Q, 0.5);
  }

  spec.groups.forEach((group, index) => {
    const groupStart = spec.groupStarts[index];
    const isFirstGroup = groupStart === 0;
    const groupEnd = groupStart + group - 1;
    const isLastGroup = index === spec.groups.length - 1;

    if (!isFirstGroup) {
      addKick(groupStart * Q, 0.62);
    }

    addSnare(groupEnd * Q, isLastGroup ? 0.72 : 0.58);
  });
}

function addKickGrooveHits(hits: RhythmHit[], spec: RhythmMeterSpec) {
  const beatCount = spec.meter.beats;

  Array.from({ length: beatCount }, (_, index) => index * Q).forEach(
    (atTicks) => {
      const velocity =
        atTicks === 0 ? 0.9 : isTimekeeperAnchor(spec, atTicks) ? 0.68 : 0.56;
      addHit(hits, spec.cycleTicks, atTicks, "kick", velocity);
    },
  );
}

function addSparseGrooveHits(hits: RhythmHit[], spec: RhythmMeterSpec) {
  addHit(hits, spec.cycleTicks, 0, "kick", 0.84);

  spec.groupStarts.slice(1).forEach((groupStart) => {
    addHit(hits, spec.cycleTicks, groupStart * Q, "kick", 0.5);
  });

  if (spec.meter.beats > 1) {
    addHit(hits, spec.cycleTicks, (spec.meter.beats - 1) * Q, "snare", 0.54);
  }
}

function addGrooveHits(
  hits: RhythmHit[],
  recipe: RhythmRecipe,
  spec: RhythmMeterSpec,
) {
  switch (recipe.groove) {
    case "off":
      break;
    case "kick":
      addKickGrooveHits(hits, spec);
      break;
    case "backbeat":
      addBackbeatGrooveHits(hits, spec);
      break;
    case "sparse":
      addSparseGrooveHits(hits, spec);
      break;
  }
}

function isTimekeeperAnchor(spec: RhythmMeterSpec, atTicks: number) {
  return spec.groupStarts.some((groupStart) => atTicks === groupStart * Q);
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
  const spec = createRhythmMeterSpec(recipe);
  const hits: RhythmHit[] = [];

  addGrooveHits(hits, recipe, spec);
  addTimekeeperHits(hits, recipe, spec);

  return {
    cycleTicks: spec.cycleTicks,
    hits: sortHits(hits),
    meter: spec.meter,
    ppq: RHYTHM_PPQ,
  };
}

export function getRhythmRecipeLabel(recipe: RhythmRecipe) {
  const beatLabel = getRhythmBeatCountLabel(recipe);
  const grooveLabel = getRhythmGrooveOptionLabel(recipe.groove);
  const timekeeperLabel = getRhythmTimekeeperLabel(recipe.timekeeper);
  const suffix =
    recipe.timekeeper.sound === "off"
      ? "No Timekeeper"
      : `${timekeeperLabel} Timekeeper`;

  return `${beatLabel} - ${grooveLabel} - ${suffix}`;
}

export function getRhythmBeatCountLabel(recipe: RhythmRecipe) {
  const base = `${recipe.beats} ${recipe.beats === 1 ? "Beat" : "Beats"}`;
  const feelLabel = getRhythmMeterFeelLabel(recipe);

  return feelLabel ? `${base} (${feelLabel})` : base;
}

function getRhythmMeterFeelLabel(recipe: RhythmRecipe) {
  const perBeat = getRhythmSubdivisionCountPerBeat(recipe.timekeeper);
  const feelLabels: string[] = [];

  if (perBeat === 3 && [2, 3, 4, 5, 7].includes(recipe.beats)) {
    feelLabels.push(`${recipe.beats * 3}/8 Feel`);
  }

  if (perBeat !== 3 && [3, 4, 5, 7].includes(recipe.beats)) {
    feelLabels.push(`${recipe.beats}/4 Feel`);
  }

  const groupingLabel = getRhythmVisibleGroupingLabel(recipe);

  if (groupingLabel) {
    feelLabels.push(groupingLabel);
  }

  return feelLabels.length > 0 ? feelLabels.join(", ") : undefined;
}

function getRhythmVisibleGroupingLabel(recipe: RhythmRecipe) {
  if (getRhythmGroupingOptions(recipe.beats).length <= 1) {
    return undefined;
  }

  return getRhythmBeatGroups(recipe).join("+");
}

function getRhythmSubdivisionCountPerBeat(timekeeper: RhythmTimekeeperRecipe) {
  if (timekeeper.feel === "triplet") {
    return 3;
  }

  if (timekeeper.feel === "swing") {
    return 2;
  }

  switch (timekeeper.subdivision) {
    case "quarter":
      return 1;
    case "eighth":
      return 2;
    case "sixteenth":
      return 4;
  }
}

export function getRhythmTimekeeperLabel(timekeeper: RhythmTimekeeperRecipe) {
  if (timekeeper.sound === "off") {
    return "Off";
  }

  const soundLabel = getOptionLabel(
    rhythmTimekeeperSoundOptions,
    timekeeper.sound,
  );
  const rhythmLabel =
    timekeeper.feel === "straight"
      ? getOptionLabel(
          rhythmTimekeeperSubdivisionOptions,
          timekeeper.subdivision,
        )
      : getOptionLabel(rhythmTimekeeperFeelOptions, timekeeper.feel);

  return `${soundLabel} ${rhythmLabel}`;
}

export function getPercussionRegionId(sampleId: PercussionSampleId) {
  return `percussion-${sampleId}`;
}
