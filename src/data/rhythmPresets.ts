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

export type RhythmTimekeeperSound = "hat" | "ride" | "shaker";
export type RhythmTimekeeperSubdivision = "quarter" | "eighth" | "sixteenth";
export type RhythmTimekeeperFeel =
  | "off"
  | "straight"
  | "triplet"
  | "swing"
  | "shuffle";

const rhythmBeatGroupsByGrouping = {
  "1+1": [1, 1],
  "1+2": [1, 2],
  "1+3": [1, 3],
  "2": [2],
  "2+1": [2, 1],
  "2+2+1": [2, 2, 1],
  "2+2+3": [2, 2, 3],
  "2+3": [2, 3],
  "2+3+3": [2, 3, 3],
  "2+4": [2, 4],
  "3+1": [3, 1],
  "3+2": [3, 2],
  "3+3": [3, 3],
  "3+3+2": [3, 3, 2],
  "3+4": [3, 4],
  "4": [4],
  "4+2": [4, 2],
  "4+3": [4, 3],
} as const satisfies Record<string, readonly number[]>;

export type RhythmGroove = "pulse" | "backbeat" | "bluegrass";
export type RhythmGrouping = "auto" | keyof typeof rhythmBeatGroupsByGrouping;

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

export interface RhythmTheoryReadout {
  detail: string;
  title: string;
}

const Q = RHYTHM_PPQ;
const E = RHYTHM_PPQ / 2;
const SIXTEENTH = RHYTHM_PPQ / 4;

export const RHYTHM_MIN_BEATS = 2;
export const RHYTHM_MAX_BEATS = 8;

export const rhythmTimekeeperSoundOptions = [
  {
    id: "hat",
    label: "Hi-Hat",
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
    label: "1 per Beat",
    description: "One timekeeper hit per beat.",
  },
  {
    id: "eighth",
    label: "2 per Beat",
    description: "Two timekeeper hits per beat.",
  },
  {
    id: "sixteenth",
    label: "4 per Beat",
    description: "Four timekeeper hits per beat.",
  },
] as const satisfies readonly RhythmRecipeOption<RhythmTimekeeperSubdivision>[];

export const rhythmTimekeeperFeelOptions = [
  {
    id: "off",
    label: "Off",
    description: "No timekeeper hits.",
  },
  {
    id: "straight",
    label: "Straight",
    description: "Even subdivisions.",
  },
  {
    id: "triplet",
    label: "3 per Beat",
    description: "Three evenly spaced subdivisions per beat.",
  },
  {
    id: "swing",
    label: "Swing",
    description: "Soft swung offbeats leading into the beat.",
  },
  {
    id: "shuffle",
    label: "Shuffle",
    description: "A swung offbeat on every beat.",
  },
] as const satisfies readonly RhythmRecipeOption<RhythmTimekeeperFeel>[];

export const rhythmTimekeeperOptions = {
  feel: rhythmTimekeeperFeelOptions,
  sound: rhythmTimekeeperSoundOptions,
  subdivision: rhythmTimekeeperSubdivisionOptions,
} as const;

export const rhythmGrooveOptions = [
  {
    id: "pulse",
    label: "Pulse",
    description: "Bass drum on the counted beats.",
  },
  {
    id: "backbeat",
    label: "Backbeat",
    description: "A simple kick and snare foundation.",
  },
  {
    id: "bluegrass",
    label: "Drive",
    description: "Bass drum on the beat with snare on the offbeats.",
  },
] as const satisfies readonly RhythmRecipeOption<RhythmGroove>[];

export const rhythmGroupingOptions = [
  {
    id: "auto",
    label: "Default",
    description: "Use the default grouping for this beat count.",
  },
  {
    id: "1+1",
    label: "1+1",
    description: "Group two beats as one plus one.",
  },
  {
    id: "1+2",
    label: "1+2",
    description: "Group three beats as one plus two.",
  },
  {
    id: "1+3",
    label: "1+3",
    description: "Group four beats as one plus three.",
  },
  {
    id: "2",
    label: "2",
    description: "Group two beats as one phrase.",
  },
  {
    id: "2+1",
    label: "2+1",
    description: "Group three beats as two plus one.",
  },
  {
    id: "2+2+1",
    label: "2+2+1",
    description: "Group five beats as two plus two plus one.",
  },
  {
    id: "2+2+3",
    label: "2+2+3",
    description: "Group seven beats as two plus two plus three.",
  },
  {
    id: "3+2",
    label: "3+2",
    description: "Group five beats as three plus two.",
  },
  {
    id: "3+3",
    label: "3+3",
    description: "Group six beats as three plus three.",
  },
  {
    id: "2+3",
    label: "2+3",
    description: "Group five beats as two plus three.",
  },
  {
    id: "2+3+3",
    label: "2+3+3",
    description: "Group eight beats as two plus three plus three.",
  },
  {
    id: "2+4",
    label: "2+4",
    description: "Group six beats as two plus four.",
  },
  {
    id: "3+1",
    label: "3+1",
    description: "Group four beats as three plus one.",
  },
  {
    id: "3+3+2",
    label: "3+3+2",
    description: "Group eight beats as three plus three plus two.",
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
  {
    id: "4",
    label: "4",
    description: "Group four beats as one phrase.",
  },
  {
    id: "4+2",
    label: "4+2",
    description: "Group six beats as four plus two.",
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
  hat: {
    sampleId: "closed-hat",
    velocityScale: 0.672,
  },
  ride: {
    sampleId: "ride",
    velocityScale: 0.45,
  },
  shaker: {
    sampleId: "shaker",
    velocityScale: 1,
  },
} as const satisfies Record<
  RhythmTimekeeperSound,
  { sampleId: PercussionSampleId; velocityScale: number }
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

function scaleVelocity(velocity: number | undefined, scale: number) {
  return Math.round((velocity ?? 0) * scale * 1000) / 1000;
}

function scaleTimekeeperHitVelocities(
  hits: RhythmHit[],
  startIndex: number,
  scale: number,
) {
  if (scale === 1) {
    return;
  }

  hits.slice(startIndex).forEach((hit) => {
    hit.velocity = scaleVelocity(hit.velocity, scale);
  });
}

const defaultRhythmBeatGroups = {
  2: [2],
  3: [3],
  4: [2, 2],
  5: [3, 2],
  6: [4, 2],
  7: [4, 3],
  8: [4, 4],
} as const satisfies Record<number, readonly number[]>;

const rhythmGroupingOptionsByBeatCount: Record<
  number,
  readonly RhythmGrouping[]
> = {
  2: ["auto", "1+1"],
  3: ["auto", "2+1", "1+2"],
  4: ["auto", "4", "3+1"],
  5: ["auto", "2+3", "2+2+1"],
  6: ["auto", "2+4", "3+3"],
  7: ["auto", "3+4", "2+2+3"],
  8: ["auto", "3+3+2", "2+3+3"],
};

export function getRhythmGroupingOptions(
  beats: number,
): readonly RhythmGrouping[] {
  return rhythmGroupingOptionsByBeatCount[beats] ?? (["auto"] as const);
}

export function getRhythmGroupingChoiceLabel(
  beats: number,
  grouping: RhythmGrouping,
) {
  const groups =
    grouping === "auto"
      ? (defaultRhythmBeatGroups[
          beats as keyof typeof defaultRhythmBeatGroups
        ] ?? [beats])
      : rhythmBeatGroupsByGrouping[grouping];

  return groups.join("+");
}

export function getRhythmGrooveOptionLabel(groove: RhythmGroove) {
  return getOptionLabel(rhythmGrooveOptions, groove);
}

export function rhythmGrooveUsesGrouping(groove: RhythmGroove) {
  return groove === "backbeat";
}

export function rhythmGrooveSupportsTimekeeperFeel(
  groove: RhythmGroove,
  feel: RhythmTimekeeperFeel,
) {
  return groove !== "bluegrass" || feel === "off" || feel === "straight";
}

export function getRhythmGroupingReadout(recipe: RhythmRecipe) {
  return getRhythmBeatGroups(recipe).join("+");
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

function getBackbeatGroupSnareOffsets(group: number, isOnlyGroup: boolean) {
  if (group <= 1) {
    return [];
  }

  if (isOnlyGroup && group === 3) {
    return [1, 2];
  }

  if (isOnlyGroup && group >= 4) {
    return [Math.floor(group / 2)];
  }

  return [group - 1];
}

function addBackbeatGrooveHits(hits: RhythmHit[], spec: RhythmMeterSpec) {
  const addKick = (atTicks: number, velocity = 0.78) =>
    addHit(hits, spec.cycleTicks, atTicks, "kick", velocity);
  const addSnare = (atTicks: number, velocity = 0.68) =>
    addHit(hits, spec.cycleTicks, atTicks, "snare", velocity);

  const snareTicks: number[] = [];

  spec.groups.forEach((group, index) => {
    const groupStart = spec.groupStarts[index];

    addKick(groupStart * Q, groupStart === 0 ? 0.9 : 0.62);

    getBackbeatGroupSnareOffsets(group, spec.groups.length === 1).forEach(
      (offset) => {
        snareTicks.push((groupStart + offset) * Q);
      },
    );
  });

  snareTicks.forEach((atTicks, index) => {
    addSnare(atTicks, index === snareTicks.length - 1 ? 0.72 : 0.58);
  });
}

function addPulseGrooveHits(hits: RhythmHit[], spec: RhythmMeterSpec) {
  const beatCount = spec.meter.beats;

  Array.from({ length: beatCount }, (_, index) => index * Q).forEach(
    (atTicks, index) => {
      addHit(hits, spec.cycleTicks, atTicks, "kick", index === 0 ? 0.9 : 0.58);
    },
  );
}

function addBluegrassGrooveHits(hits: RhythmHit[], spec: RhythmMeterSpec) {
  const beatCount = spec.meter.beats;

  Array.from({ length: beatCount }, (_, index) => index * Q).forEach(
    (atTicks, index) => {
      addHit(hits, spec.cycleTicks, atTicks, "kick", index === 0 ? 0.88 : 0.58);
      addHit(hits, spec.cycleTicks, atTicks + E, "snare", 0.52);
    },
  );
}

function addGrooveHits(
  hits: RhythmHit[],
  recipe: RhythmRecipe,
  spec: RhythmMeterSpec,
) {
  switch (recipe.groove) {
    case "pulse":
      addPulseGrooveHits(hits, spec);
      break;
    case "backbeat":
      addBackbeatGrooveHits(hits, spec);
      break;
    case "bluegrass":
      addBluegrassGrooveHits(hits, spec);
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

  const pairTicks = Q;
  const offbeatTicks = Math.round((pairTicks * 2) / 3);
  const count = Math.ceil(spec.cycleTicks / pairTicks);

  Array.from({ length: count }, (_, index) => index * pairTicks).forEach(
    (atTicks, index) => {
      addHit(
        hits,
        spec.cycleTicks,
        atTicks,
        sampleId,
        isTimekeeperAnchor(spec, atTicks) ? 0.52 : 0.38,
      );

      if (index % 2 === 1) {
        addHit(hits, spec.cycleTicks, atTicks + offbeatTicks, sampleId, 0.24);
      }
    },
  );
}

function addShuffleTimekeeperHits(
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
  if (recipe.timekeeper.feel === "off") {
    return;
  }

  const sample = timekeeperSamples[recipe.timekeeper.sound];
  const startIndex = hits.length;

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
    case "shuffle":
      addShuffleTimekeeperHits(
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

  scaleTimekeeperHitVelocities(hits, startIndex, sample.velocityScale);
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
  const beatLabel = getRhythmRecipeMeterLabel(recipe);
  const grooveLabel = getRhythmGrooveOptionLabel(recipe.groove);
  const timekeeperLabel = getRhythmTimekeeperLabel(recipe.timekeeper);
  const suffix =
    recipe.timekeeper.feel === "off"
      ? "No Timekeeper"
      : `${timekeeperLabel} Timekeeper`;

  return `${beatLabel} - ${grooveLabel} - ${suffix}`;
}

function getRhythmRecipeMeterLabel(recipe: RhythmRecipe) {
  const title = getRhythmTheoryReadout(recipe).title;
  const groupingLabel = getRhythmVisibleGroupingLabel(recipe);

  return groupingLabel ? `${title} (${groupingLabel})` : title;
}

export function getRhythmTheoryReadout(
  recipe: RhythmRecipe,
): RhythmTheoryReadout {
  const title = getRhythmTheoryMeterTitle(recipe);
  const details = [
    getRhythmTheoryMeterClassDetail(recipe, title),
    getRhythmTheoryGroupingDetail(recipe, title),
    getRhythmSubdivisionDetail(recipe, title),
  ].filter((detail): detail is string => Boolean(detail));

  return {
    title,
    detail: details.join(" • "),
  };
}

function getRhythmTheoryMeterTitle(recipe: RhythmRecipe) {
  const perBeat = getRhythmSubdivisionCountPerBeat(recipe.timekeeper);
  const groups = getRhythmBeatGroups(recipe);

  if (perBeat === 3) {
    if ([2, 3, 4].includes(recipe.beats)) {
      return `${recipe.beats * 3}/8`;
    }

    if (groups.length === 2 && groups.every((group) => group === 3)) {
      return "2 Bars of 9/8";
    }

    if (groups.length === 2 && groups.every((group) => group === 4)) {
      return "2 Bars of 12/8";
    }
  }

  if (groups.length === 2 && groups.every((group) => group === 3)) {
    return "2 Bars of 3/4";
  }

  if (groups.length === 2 && groups.every((group) => group === 4)) {
    return "2 Bars of 4/4";
  }

  return `${recipe.beats}/4`;
}

function getRhythmTheoryMeterClassDetail(
  recipe: RhythmRecipe,
  meterTitle: string,
) {
  const singleBarMeter = getSingleBarMeterTitle(meterTitle);

  switch (singleBarMeter) {
    case "2/4":
      return "Simple Duple Meter";
    case "3/4":
      return "Simple Triple Meter";
    case "4/4":
      return "Simple Quadruple Meter";
    case "6/8":
      return "Compound Duple Meter";
    case "9/8":
      return "Compound Triple Meter";
    case "12/8":
      return "Compound Quadruple Meter";
  }

  if (
    recipe.beats === 5 ||
    recipe.beats === 7 ||
    getRhythmVisibleGroupingLabel(recipe) !== undefined
  ) {
    return "Additive Meter";
  }

  return undefined;
}

function getSingleBarMeterTitle(meterTitle: string) {
  return meterTitle.startsWith("2 Bars of ")
    ? meterTitle.slice("2 Bars of ".length)
    : meterTitle;
}

function isCompoundMeterTitle(meterTitle: string) {
  const singleBarMeter = getSingleBarMeterTitle(meterTitle);

  return (
    singleBarMeter === "6/8" ||
    singleBarMeter === "9/8" ||
    singleBarMeter === "12/8"
  );
}

function getRhythmTheoryGroupingDetail(
  recipe: RhythmRecipe,
  meterTitle: string,
) {
  const perBeat = getRhythmSubdivisionCountPerBeat(recipe.timekeeper);

  if (perBeat === 3 && [2, 3, 4].includes(recipe.beats)) {
    return `${recipe.beats} ${recipe.beats === 1 ? "Group" : "Groups"} of 3`;
  }

  if (meterTitle.startsWith("2 Bars of ")) {
    return undefined;
  }

  return getRhythmVisibleGroupingLabel(recipe);
}

function getRhythmSubdivisionDetail(recipe: RhythmRecipe, meterTitle: string) {
  switch (recipe.timekeeper.feel) {
    case "off":
      return "Quarter-Note Pulse";
    case "straight":
      switch (recipe.timekeeper.subdivision) {
        case "quarter":
          return "Quarter Notes";
        case "eighth":
          return "Straight Eighths";
        case "sixteenth":
          return "Straight Sixteenths";
      }
    case "triplet":
      return isCompoundMeterTitle(meterTitle) ||
        [2, 3, 4].includes(recipe.beats)
        ? undefined
        : "Triplet Subdivision";
    case "swing":
      return "Swing Eighths";
    case "shuffle":
      return "Shuffle Eighths";
  }
}

function getRhythmVisibleGroupingLabel(recipe: RhythmRecipe) {
  if (!rhythmGrooveUsesGrouping(recipe.groove)) {
    return undefined;
  }

  if (recipe.grouping === "auto" && ![5, 6, 7].includes(recipe.beats)) {
    return undefined;
  }

  return getRhythmBeatGroups(recipe).join("+");
}

function getRhythmSubdivisionCountPerBeat(timekeeper: RhythmTimekeeperRecipe) {
  if (timekeeper.feel === "off") {
    return 0;
  }

  if (timekeeper.feel === "triplet") {
    return 3;
  }

  if (timekeeper.feel === "swing" || timekeeper.feel === "shuffle") {
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
  if (timekeeper.feel === "off") {
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
