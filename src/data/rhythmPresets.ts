import {
  beatSubdivisionIds,
  getBeatSubdivisionCount,
  getBeatSubdivisionDensityLabel,
  getBeatSubdivisionDescription,
  getBeatSubdivisionTheoryLabel,
  type BeatSubdivisionId,
} from "@/utils/music-theory/beatSubdivision";

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
export type RhythmTimekeeperSubdivision = BeatSubdivisionId;
export type RhythmTimekeeperFeel =
  | "off"
  | "straight"
  | "triplet"
  | "swing"
  | "shuffle";

const rhythmBeatGroupsByGrouping = {
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
  "3+2+3": [3, 2, 3],
  "3+3+2": [3, 3, 2],
  "3+4": [3, 4],
  "4": [4],
  "4+2": [4, 2],
  "4+3": [4, 3],
  "5+1": [5, 1],
} as const satisfies Record<string, readonly number[]>;

export type RhythmGroove = "pulse" | "kit" | "bluegrass";
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

type RhythmTheoryMeterClass =
  | "additive"
  | "compound-duple"
  | "compound-quadruple"
  | "compound-triple"
  | "simple"
  | "simple-duple"
  | "simple-quadruple"
  | "simple-triple";

type RhythmTheoryCompoundMeterClass = Extract<
  RhythmTheoryMeterClass,
  "compound-duple" | "compound-quadruple" | "compound-triple"
>;
type RhythmTheorySimpleMeterClass = Exclude<
  RhythmTheoryMeterClass,
  RhythmTheoryCompoundMeterClass
>;

interface RhythmTheoryCompoundGrouping {
  groupCount: number;
  unitCount: number;
  unitName: "Eighth" | "Quarter Note";
}

type RhythmTheoryMeter =
  | {
      classDetail: RhythmTheoryCompoundMeterClass;
      compoundGrouping: RhythmTheoryCompoundGrouping;
      isCompound: true;
      title: string;
    }
  | {
      classDetail: RhythmTheorySimpleMeterClass;
      isCompound: false;
      title: string;
    };

interface RhythmTheoryCompoundMeter {
  classDetail: RhythmTheoryCompoundMeterClass;
  compoundGrouping: RhythmTheoryCompoundGrouping;
  isCompound: true;
  title: string;
}

const rhythmTheoryMeterClassLabels = {
  additive: "Additive",
  "compound-duple": "Compound Duple",
  "compound-quadruple": "Compound Quadruple",
  "compound-triple": "Compound Triple",
  simple: "Simple",
  "simple-duple": "Simple Duple",
  "simple-quadruple": "Simple Quadruple",
  "simple-triple": "Simple Triple",
} as const satisfies Record<RhythmTheoryMeterClass, string>;

const Q = RHYTHM_PPQ;
const E = RHYTHM_PPQ / 2;

export const RHYTHM_MIN_BEATS = 1;
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

export const rhythmTimekeeperSubdivisionOptions = beatSubdivisionIds.map(
  (id) => ({
    id,
    label: getBeatSubdivisionDensityLabel(id),
    description: getBeatSubdivisionDescription(id),
  }),
) satisfies readonly RhythmRecipeOption<RhythmTimekeeperSubdivision>[];

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
    id: "kit",
    label: "Kit",
    description: "A kick and snare kit foundation.",
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
    id: "5+1",
    label: "5+1",
    description: "Group six beats as five plus one.",
  },
  {
    id: "3+1",
    label: "3+1",
    description: "Group four beats as three plus one.",
  },
  {
    id: "3+2+3",
    label: "3+2+3",
    description: "Group eight beats as three plus two plus three.",
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
  groove: "kit",
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
  1: [1],
  2: [2],
  3: [3],
  4: [2, 2],
  5: [3, 2],
  6: [4, 2],
  7: [4, 3],
  8: [3, 3, 2],
} as const satisfies Record<number, readonly number[]>;

const rhythmGroupingOptionsByBeatCount: Record<
  number,
  readonly RhythmGrouping[]
> = {
  // Default first, then alternatives from common/settled toward more pushed.
  1: ["auto"],
  2: ["auto"],
  3: ["auto", "2+1", "1+2"],
  4: ["auto", "4", "3+1"],
  5: ["auto", "2+3", "2+2+1"],
  6: ["auto", "2+4", "5+1"],
  7: ["auto", "3+4", "2+2+3"],
  8: ["auto", "3+2+3", "2+3+3"],
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

export function rhythmGrooveSupportsBeatCount(
  groove: RhythmGroove,
  beats: number,
) {
  return beats > 1 || groove !== "kit";
}

export function rhythmGrooveSupportsTimekeeperFeel(
  groove: RhythmGroove,
  feel: RhythmTimekeeperFeel,
) {
  return groove !== "bluegrass" || feel === "off" || feel === "straight";
}

export function rhythmRecipeSupportsTimekeeperFeel(
  groove: RhythmGroove,
  beats: number,
  feel: RhythmTimekeeperFeel,
) {
  if (beats <= 1 && feel === "swing") {
    return false;
  }

  return rhythmGrooveSupportsTimekeeperFeel(groove, feel);
}

function getTripletTimekeeperSubdivision(
  subdivision: RhythmTimekeeperSubdivision,
): RhythmTimekeeperSubdivision {
  return subdivision === "sixteenth" ||
    subdivision === "sixteenth-triplet" ||
    subdivision === "thirty-second"
    ? "sixteenth-triplet"
    : "eighth-triplet";
}

export function getRhythmCanonicalTimekeeper(
  timekeeper: RhythmTimekeeperRecipe,
): RhythmTimekeeperRecipe {
  if (timekeeper.feel === "triplet") {
    return {
      ...timekeeper,
      feel: "straight",
      subdivision: getTripletTimekeeperSubdivision(timekeeper.subdivision),
    };
  }

  return {
    ...timekeeper,
    subdivision:
      timekeeper.feel === "swing" || timekeeper.feel === "shuffle"
        ? "eighth"
        : timekeeper.subdivision,
  };
}

export function getRhythmCompatibleTimekeeper(
  groove: RhythmGroove,
  beats: number,
  timekeeper: RhythmTimekeeperRecipe,
): RhythmTimekeeperRecipe {
  const canonicalTimekeeper = getRhythmCanonicalTimekeeper(timekeeper);

  if (
    rhythmRecipeSupportsTimekeeperFeel(groove, beats, canonicalTimekeeper.feel)
  ) {
    return canonicalTimekeeper;
  }

  return {
    ...canonicalTimekeeper,
    feel: "straight",
    subdivision: "eighth",
  };
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

function getKitGroupSnareOffsets(group: number, isOnlyGroup: boolean) {
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

function getSwingKickVelocity(
  beatCount: number,
  groupStarts: Set<number>,
  index: number,
) {
  if (beatCount === 1) {
    return 0.26;
  }

  if (index === 0) {
    return 0.26;
  }

  return groupStarts.has(index) ? 0.24 : 0.2;
}

function addSwingKitGrooveHits(hits: RhythmHit[], spec: RhythmMeterSpec) {
  const addKick = (atTicks: number, velocity: number) =>
    addHit(hits, spec.cycleTicks, atTicks, "kick", velocity);
  const addSnare = (atTicks: number, velocity: number) =>
    addHit(hits, spec.cycleTicks, atTicks, "snare", velocity);
  const groupStarts = new Set(spec.groupStarts);
  const snareTicks: number[] = [];

  Array.from({ length: spec.meter.beats }, (_, index) => index * Q).forEach(
    (atTicks, index) => {
      addKick(
        atTicks,
        getSwingKickVelocity(spec.meter.beats, groupStarts, index),
      );
    },
  );

  spec.groups.forEach((group, index) => {
    const groupStart = spec.groupStarts[index];

    getKitGroupSnareOffsets(group, spec.groups.length === 1).forEach(
      (offset) => {
        snareTicks.push((groupStart + offset) * Q);
      },
    );
  });

  snareTicks.forEach((atTicks, index) => {
    addSnare(atTicks, index === snareTicks.length - 1 ? 0.28 : 0.24);
  });
}

function addKitGrooveHits(hits: RhythmHit[], spec: RhythmMeterSpec) {
  const addKick = (atTicks: number, velocity = 0.78) =>
    addHit(hits, spec.cycleTicks, atTicks, "kick", velocity);
  const addSnare = (atTicks: number, velocity = 0.68) =>
    addHit(hits, spec.cycleTicks, atTicks, "snare", velocity);

  const snareTicks: number[] = [];

  spec.groups.forEach((group, index) => {
    const groupStart = spec.groupStarts[index];

    addKick(groupStart * Q, groupStart === 0 ? 0.9 : 0.62);

    getKitGroupSnareOffsets(group, spec.groups.length === 1).forEach(
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
  const groupStarts = new Set(spec.groupStarts);
  const getVelocity = (index: number) => {
    if (beatCount === 1) {
      return 0.68;
    }

    if (index === 0) {
      return 0.9;
    }

    return groupStarts.has(index) ? 0.68 : 0.58;
  };

  Array.from({ length: beatCount }, (_, index) => index * Q).forEach(
    (atTicks, index) => {
      addHit(hits, spec.cycleTicks, atTicks, "kick", getVelocity(index));
    },
  );
}

function addSwingPulseGrooveHits(hits: RhythmHit[], spec: RhythmMeterSpec) {
  const beatCount = spec.meter.beats;
  const groupStarts = new Set(spec.groupStarts);

  Array.from({ length: beatCount }, (_, index) => index * Q).forEach(
    (atTicks, index) => {
      addHit(
        hits,
        spec.cycleTicks,
        atTicks,
        "kick",
        getSwingKickVelocity(beatCount, groupStarts, index),
      );
    },
  );
}

function addBluegrassGrooveHits(hits: RhythmHit[], spec: RhythmMeterSpec) {
  const beatCount = spec.meter.beats;
  const groupStarts = new Set(spec.groupStarts);
  const getKickVelocity = (index: number) => {
    if (beatCount === 1) {
      return 0.68;
    }

    if (index === 0) {
      return 0.88;
    }

    return groupStarts.has(index) ? 0.66 : 0.58;
  };

  Array.from({ length: beatCount }, (_, index) => index * Q).forEach(
    (atTicks, index) => {
      addHit(hits, spec.cycleTicks, atTicks, "kick", getKickVelocity(index));
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
      if (recipe.timekeeper.feel === "swing") {
        addSwingPulseGrooveHits(hits, spec);
      } else {
        addPulseGrooveHits(hits, spec);
      }
      break;
    case "kit":
      if (recipe.timekeeper.feel === "swing") {
        addSwingKitGrooveHits(hits, spec);
      } else {
        addKitGrooveHits(hits, spec);
      }
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
  stepInBeat: number,
  subdivision: RhythmTimekeeperSubdivision,
) {
  if (isTimekeeperAnchor(spec, atTicks)) {
    return 0.54;
  }

  const countPerBeat = getBeatSubdivisionCount(subdivision);
  const isBeat = stepInBeat === 0;

  if (countPerBeat === 1) {
    return 0.42;
  }

  if (countPerBeat === 2) {
    return isBeat ? 0.42 : 0.32;
  }

  if (countPerBeat === 3) {
    return isBeat ? 0.34 : 0.26;
  }

  if (countPerBeat === 4) {
    return isBeat ? 0.34 : stepInBeat === 2 ? 0.28 : 0.22;
  }

  if (isBeat) {
    return 0.32;
  }

  return countPerBeat % 2 === 0 && stepInBeat === countPerBeat / 2
    ? 0.23
    : 0.18;
}

function addStraightTimekeeperHits(
  hits: RhythmHit[],
  spec: RhythmMeterSpec,
  sampleId: PercussionSampleId,
  subdivision: RhythmTimekeeperSubdivision,
) {
  const countPerBeat = getBeatSubdivisionCount(subdivision);

  Array.from({ length: spec.meter.beats }, (_, beatIndex) => beatIndex).forEach(
    (beatIndex) => {
      Array.from({ length: countPerBeat }, (_, stepInBeat) => {
        const atTicks = beatIndex * Q + (stepInBeat * Q) / countPerBeat;

        addHit(
          hits,
          spec.cycleTicks,
          atTicks,
          sampleId,
          getStraightTimekeeperVelocity(spec, atTicks, stepInBeat, subdivision),
        );
      });
    },
  );
}

function addLegacyTripletTimekeeperHits(
  hits: RhythmHit[],
  spec: RhythmMeterSpec,
  sampleId: PercussionSampleId,
  subdivision: RhythmTimekeeperSubdivision,
) {
  addStraightTimekeeperHits(
    hits,
    spec,
    sampleId,
    getTripletTimekeeperSubdivision(subdivision),
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
      addLegacyTripletTimekeeperHits(
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
  const meter = getRhythmTheoryMeter(recipe);
  const details = [
    rhythmTheoryMeterClassLabels[meter.classDetail],
    getRhythmTheoryCompoundGroupingDetail(meter),
    getRhythmSubdivisionDetail(recipe, meter),
  ].filter((detail): detail is string => Boolean(detail));

  return {
    title: meter.title,
    detail: details.join(" • "),
  };
}

function getRhythmTheoryMeter(recipe: RhythmRecipe): RhythmTheoryMeter {
  const perBeat = getRhythmSubdivisionCountPerBeat(recipe.timekeeper);
  const groups = getRhythmBeatGroups(recipe);

  if (perBeat === 3) {
    const singleBarCompoundMeter = getCompoundMeterForPrimaryBeats(
      recipe.beats,
    );

    if (singleBarCompoundMeter) {
      return singleBarCompoundMeter;
    }
  }

  const compoundClassDetail =
    getCompoundMeterClassForEqualTripletGroups(groups);

  if (compoundClassDetail) {
    return {
      classDetail: compoundClassDetail,
      compoundGrouping: {
        groupCount: groups.length,
        unitCount: 3,
        unitName: "Quarter Note",
      },
      isCompound: true,
      title: `${recipe.beats}/4`,
    };
  }

  const classDetail =
    getSimpleMeterClassForPrimaryBeats(recipe.beats) ??
    getAdditiveMeterClass(groups) ??
    "simple";

  return {
    classDetail,
    isCompound: false,
    title: `${recipe.beats}/4`,
  };
}

function getSimpleMeterClassForPrimaryBeats(
  beats: number,
): RhythmTheorySimpleMeterClass | undefined {
  switch (beats) {
    case 2:
      return "simple-duple";
    case 3:
      return "simple-triple";
    case 4:
      return "simple-quadruple";
    default:
      return undefined;
  }
}

function getCompoundMeterForPrimaryBeats(
  beats: number,
): RhythmTheoryCompoundMeter | undefined {
  switch (beats) {
    case 2:
      return {
        classDetail: "compound-duple",
        compoundGrouping: {
          groupCount: 2,
          unitCount: 3,
          unitName: "Eighth",
        },
        isCompound: true,
        title: "6/8",
      };
    case 3:
      return {
        classDetail: "compound-triple",
        compoundGrouping: {
          groupCount: 3,
          unitCount: 3,
          unitName: "Eighth",
        },
        isCompound: true,
        title: "9/8",
      };
    case 4:
      return {
        classDetail: "compound-quadruple",
        compoundGrouping: {
          groupCount: 4,
          unitCount: 3,
          unitName: "Eighth",
        },
        isCompound: true,
        title: "12/8",
      };
    default:
      return undefined;
  }
}

function getCompoundMeterClassForEqualTripletGroups(
  groups: readonly number[],
): RhythmTheoryCompoundMeterClass | undefined {
  if (!groups.every((group) => group === 3)) {
    return undefined;
  }

  switch (groups.length) {
    case 2:
      return "compound-duple";
    case 3:
      return "compound-triple";
    case 4:
      return "compound-quadruple";
    default:
      return undefined;
  }
}

function getAdditiveMeterClass(
  groups: readonly number[],
): RhythmTheorySimpleMeterClass | undefined {
  return groups.length <= 1 || groups.every((group) => group === groups[0])
    ? undefined
    : "additive";
}

function getRhythmTheoryCompoundGroupingDetail(meter: RhythmTheoryMeter) {
  if (!meter.isCompound) {
    return undefined;
  }

  const { groupCount, unitCount, unitName } = meter.compoundGrouping;
  const groupLabel = groupCount === 1 ? "Group" : "Groups";
  const unitLabel = unitCount === 1 ? unitName : `${unitName}s`;

  return `${groupCount} ${groupLabel} of ${unitCount} ${unitLabel}`;
}

function getRhythmSubdivisionDetail(
  recipe: RhythmRecipe,
  meter: RhythmTheoryMeter,
) {
  if (meter.isCompound) {
    return undefined;
  }

  switch (recipe.timekeeper.feel) {
    case "off":
      return undefined;
    case "straight":
      return getBeatSubdivisionTheoryLabel(recipe.timekeeper.subdivision);
    case "triplet":
      return getBeatSubdivisionTheoryLabel(
        getTripletTimekeeperSubdivision(recipe.timekeeper.subdivision),
      );
    case "swing":
      return "Swing Eighths";
    case "shuffle":
      return "Shuffle Eighths";
  }
}

function getRhythmVisibleGroupingLabel(recipe: RhythmRecipe) {
  // Common simple meters already imply their default grouping. Show those only
  // when the user deliberately chooses a variation; for longer meters the
  // default grouping is part of the musical idea.
  if (recipe.grouping === "auto" && ![5, 6, 7, 8].includes(recipe.beats)) {
    return undefined;
  }

  return getRhythmBeatGroups(recipe).join("+");
}

function getRhythmSubdivisionCountPerBeat(timekeeper: RhythmTimekeeperRecipe) {
  if (timekeeper.feel === "off") {
    return 0;
  }

  if (timekeeper.feel === "triplet") {
    return getBeatSubdivisionCount(
      getTripletTimekeeperSubdivision(timekeeper.subdivision),
    );
  }

  if (timekeeper.feel === "swing" || timekeeper.feel === "shuffle") {
    return 2;
  }

  return getBeatSubdivisionCount(timekeeper.subdivision);
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
    timekeeper.feel === "swing" || timekeeper.feel === "shuffle"
      ? getOptionLabel(rhythmTimekeeperFeelOptions, timekeeper.feel)
      : getBeatSubdivisionDensityLabel(
          timekeeper.feel === "triplet"
            ? getTripletTimekeeperSubdivision(timekeeper.subdivision)
            : timekeeper.subdivision,
        );

  return `${soundLabel} ${rhythmLabel}`;
}

export function getRhythmTimekeeperRhythmReadoutLabel(
  timekeeper: RhythmTimekeeperRecipe,
) {
  if (timekeeper.feel === "off") {
    return "Off";
  }

  if (timekeeper.feel === "swing") {
    return "Swing Eighths";
  }

  if (timekeeper.feel === "shuffle") {
    return "Shuffle Eighths";
  }

  if (timekeeper.feel === "triplet") {
    return getBeatSubdivisionDensityLabel(
      getTripletTimekeeperSubdivision(timekeeper.subdivision),
    );
  }

  return getOptionLabel(
    rhythmTimekeeperSubdivisionOptions,
    timekeeper.subdivision,
  );
}

export function getPercussionRegionId(sampleId: PercussionSampleId) {
  return `percussion-${sampleId}`;
}
