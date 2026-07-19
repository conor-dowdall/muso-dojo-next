import {
  getRhythmGroupingChoiceLabel,
  getRhythmGrooveOptionLabel,
  getRhythmTheoryReadout,
  getRhythmTimekeeperRhythmReadoutLabel,
  rhythmGrooveSupportsBeatCount,
  rhythmRecipeSupportsTimekeeperFeel,
  RHYTHM_MAX_BEATS,
  RHYTHM_MIN_BEATS,
} from "@/data/rhythmPresets";
import { formatValueSummary } from "@/utils/valueSummary";
import {
  DEFAULT_RHYTHM_RECIPE,
  getRhythmTimekeeperOptionLabel,
  normalizeRhythmRecipe,
  type RhythmGroove,
  type RhythmGrouping,
  type RhythmRecipe,
  type RhythmTimekeeperFeel,
  type RhythmTimekeeperSound,
  type RhythmTimekeeperSubdivision,
} from "@/utils/rhythm/rhythmConfig";
import { beatSubdivisionOptions } from "@/data/beatSubdivisions";

export const rhythmTimekeeperSoundChoices = [
  {
    label: "Turn timekeeper off",
    name: "Off",
    sound: undefined,
    text: "Off",
  },
  {
    label: "Use closed hi-hat timekeeper",
    name: "Hi-Hat",
    sound: "hat",
    text: "Hat",
  },
  {
    label: "Use ride cymbal timekeeper",
    name: "Ride",
    sound: "ride",
    text: "Ride",
  },
  {
    label: "Use shaker timekeeper",
    name: "Shaker",
    sound: "shaker",
    text: "Shk",
  },
] as const satisfies readonly {
  label: string;
  name: string;
  sound: RhythmTimekeeperSound | undefined;
  text: string;
}[];

export const rhythmGrooveChoices = [
  {
    description: "Bass drum on each counted beat",
    groove: "pulse",
    label: "Use bass drum pulse on the counted beats",
    text: "Pulse",
  },
  {
    description: "Kick and snare groove",
    groove: "kit",
    label: "Use kick and snare kit foundation",
    text: "Kit",
  },
  {
    description: "Bluegrass-style offbeat snare",
    groove: "bluegrass",
    label: "Use bluegrass-style offbeat snare drive",
    text: "Drive",
  },
] as const satisfies readonly {
  description: string;
  groove: RhythmGroove;
  label: string;
  text: string;
}[];

export const rhythmTimekeeperStraightSubdivisionChoices =
  beatSubdivisionOptions.map((option) => ({
    label: option.controlLabel,
    text: String(option.countPerBeat),
    feel: "straight" as const,
    subdivision: option.key,
  })) satisfies readonly {
    feel: RhythmTimekeeperFeel;
    label: string;
    subdivision: RhythmTimekeeperSubdivision;
    text: string;
  }[];

export const rhythmTimekeeperFeelSubdivisionChoices = [
  {
    label: "Use swing eighths timekeeper pattern",
    text: "Sw",
    feel: "swing",
    subdivision: "2-per-beat",
  },
  {
    label: "Use shuffle eighths timekeeper pattern",
    text: "Shf",
    feel: "shuffle",
    subdivision: "2-per-beat",
  },
] as const satisfies readonly {
  feel: RhythmTimekeeperFeel;
  label: string;
  subdivision: RhythmTimekeeperSubdivision;
  text: string;
}[];

export const rhythmTimekeeperSubdivisionChoices = [
  ...rhythmTimekeeperStraightSubdivisionChoices,
  ...rhythmTimekeeperFeelSubdivisionChoices,
] as const satisfies readonly {
  feel: RhythmTimekeeperFeel;
  label: string;
  subdivision: RhythmTimekeeperSubdivision;
  text: string;
}[];

export const rhythmStarterChoices = [
  {
    id: "4-4",
    label: "4/4",
  },
  {
    id: "country",
    label: "Country",
  },
  {
    id: "swing",
    label: "Swing",
  },
  {
    id: "shuffle",
    label: "Shuffle",
  },
  {
    id: "3-4",
    label: "3/4",
  },
  {
    id: "6-8",
    label: "6/8",
  },
  {
    id: "12-8",
    label: "12/8",
  },
] as const;

export type RhythmStarterId = (typeof rhythmStarterChoices)[number]["id"];
type RhythmTimekeeperSubdivisionChoice =
  (typeof rhythmTimekeeperSubdivisionChoices)[number];

export interface RhythmBeatCountConstraint {
  requiredBarDivision?: number;
}

const rhythmStarterRecipes = {
  "4-4": DEFAULT_RHYTHM_RECIPE,
  "3-4": {
    ...DEFAULT_RHYTHM_RECIPE,
    beats: 3,
  },
  "6-8": {
    ...DEFAULT_RHYTHM_RECIPE,
    beats: 2,
    timekeeper: {
      ...DEFAULT_RHYTHM_RECIPE.timekeeper,
      feel: "straight",
      subdivision: "3-per-beat",
    },
  },
  "12-8": {
    ...DEFAULT_RHYTHM_RECIPE,
    beats: 4,
    timekeeper: {
      ...DEFAULT_RHYTHM_RECIPE.timekeeper,
      feel: "straight",
      subdivision: "3-per-beat",
    },
  },
  shuffle: {
    ...DEFAULT_RHYTHM_RECIPE,
    timekeeper: {
      ...DEFAULT_RHYTHM_RECIPE.timekeeper,
      feel: "shuffle",
      sound: "hat",
      subdivision: "2-per-beat",
    },
  },
  swing: {
    ...DEFAULT_RHYTHM_RECIPE,
    timekeeper: {
      ...DEFAULT_RHYTHM_RECIPE.timekeeper,
      feel: "swing",
      sound: "ride",
      subdivision: "2-per-beat",
    },
  },
  country: {
    ...DEFAULT_RHYTHM_RECIPE,
    groove: "bluegrass",
    timekeeper: {
      ...DEFAULT_RHYTHM_RECIPE.timekeeper,
      feel: "straight",
      sound: "hat",
      subdivision: "2-per-beat",
    },
  },
} satisfies Record<RhythmStarterId, RhythmRecipe>;

function clampBeatCount(beats: number) {
  return Math.min(RHYTHM_MAX_BEATS, Math.max(RHYTHM_MIN_BEATS, beats));
}

function normalizeRequiredBarDivision(
  constraint: RhythmBeatCountConstraint | undefined,
) {
  const requiredBarDivision = constraint?.requiredBarDivision;

  return typeof requiredBarDivision === "number" &&
    Number.isInteger(requiredBarDivision) &&
    requiredBarDivision > 1
    ? requiredBarDivision
    : undefined;
}

function getCompatibleRecipe(recipe: RhythmRecipe) {
  return normalizeRhythmRecipe(recipe);
}

export function rhythmRecipesAreEqual(left: RhythmRecipe, right: RhythmRecipe) {
  return (
    left.beats === right.beats &&
    left.groove === right.groove &&
    left.grouping === right.grouping &&
    left.timekeeper.feel === right.timekeeper.feel &&
    left.timekeeper.sound === right.timekeeper.sound &&
    left.timekeeper.subdivision === right.timekeeper.subdivision
  );
}

export function getCompatibleRhythmBeatCounts(
  constraint: RhythmBeatCountConstraint | undefined,
) {
  const requiredBarDivision = normalizeRequiredBarDivision(constraint);

  return Array.from(
    { length: RHYTHM_MAX_BEATS - RHYTHM_MIN_BEATS + 1 },
    (_, index) => RHYTHM_MIN_BEATS + index,
  ).filter(
    (beats) =>
      requiredBarDivision === undefined || beats % requiredBarDivision === 0,
  );
}

export function isRhythmBeatCountCompatible(
  beats: number,
  constraint: RhythmBeatCountConstraint | undefined,
) {
  const requiredBarDivision = normalizeRequiredBarDivision(constraint);

  return requiredBarDivision === undefined || beats % requiredBarDivision === 0;
}

function getNearestCompatibleRhythmBeatCount(
  beats: number,
  constraint: RhythmBeatCountConstraint | undefined,
) {
  if (isRhythmBeatCountCompatible(beats, constraint)) {
    return clampBeatCount(beats);
  }

  const compatibleBeatCounts = getCompatibleRhythmBeatCounts(constraint);
  const defaultBeatCount = DEFAULT_RHYTHM_RECIPE.beats;

  if (compatibleBeatCounts.includes(defaultBeatCount)) {
    return defaultBeatCount;
  }

  return (
    compatibleBeatCounts.toSorted(
      (left, right) =>
        Math.abs(left - beats) - Math.abs(right - beats) || left - right,
    )[0] ?? clampBeatCount(beats)
  );
}

export function getAdjacentCompatibleRhythmBeatCount(
  beats: number,
  constraint: RhythmBeatCountConstraint | undefined,
  direction: "next" | "previous",
) {
  const compatibleBeatCounts = getCompatibleRhythmBeatCounts(constraint);
  const candidate =
    direction === "next"
      ? compatibleBeatCounts.find((beatCount) => beatCount > beats)
      : compatibleBeatCounts.findLast((beatCount) => beatCount < beats);

  return candidate ?? beats;
}

export function getRecipeWithBeatCountConstraint(
  recipe: RhythmRecipe,
  constraint: RhythmBeatCountConstraint | undefined,
) {
  return getRecipeWithBeatCount(
    recipe,
    getNearestCompatibleRhythmBeatCount(recipe.beats, constraint),
  );
}

export function getRhythmStarterRecipe(starterId: RhythmStarterId) {
  return getCompatibleRecipe(rhythmStarterRecipes[starterId]);
}

export function isRhythmStarterChoiceAvailable(
  starterId: RhythmStarterId,
  constraint: RhythmBeatCountConstraint | undefined,
) {
  return isRhythmBeatCountCompatible(
    getRhythmStarterRecipe(starterId).beats,
    constraint,
  );
}

function findRhythmStarterChoice(starterId: RhythmStarterId) {
  return rhythmStarterChoices.find((choice) => choice.id === starterId);
}

export function getRhythmStarterChoiceForRecipe(recipe: RhythmRecipe) {
  const normalizedRecipe = getCompatibleRecipe(recipe);
  const theoryTitle = getRhythmTheoryReadout(normalizedRecipe).title;

  if (theoryTitle === "6/8") {
    return findRhythmStarterChoice("6-8");
  }

  if (theoryTitle === "12/8") {
    return findRhythmStarterChoice("12-8");
  }

  if (theoryTitle === "4/4") {
    if (normalizedRecipe.timekeeper.feel === "swing") {
      return findRhythmStarterChoice("swing");
    }

    if (normalizedRecipe.timekeeper.feel === "shuffle") {
      return findRhythmStarterChoice("shuffle");
    }

    if (normalizedRecipe.groove === "bluegrass") {
      return findRhythmStarterChoice("country");
    }

    return findRhythmStarterChoice("4-4");
  }

  if (theoryTitle === "3/4") {
    return findRhythmStarterChoice("3-4");
  }

  return undefined;
}

export function getRhythmChoiceSummary(recipe: RhythmRecipe) {
  const meterLabel = getRhythmTheoryReadout(recipe).title;
  const choiceLabel = getRhythmStarterChoiceForRecipe(recipe)?.label;

  return formatValueSummary([
    choiceLabel !== meterLabel ? choiceLabel : undefined,
    meterLabel,
  ]);
}

export function getRhythmStarterSummary(starterId: RhythmStarterId) {
  const recipe = getRhythmStarterRecipe(starterId);

  return formatValueSummary([
    getRhythmBeatControlLabel(recipe.beats),
    getRhythmGrooveOptionLabel(recipe.groove),
    getRhythmTimekeeperSummary(recipe),
  ]);
}

export function getRecipeWithBeatCount(recipe: RhythmRecipe, beats: number) {
  return getCompatibleRecipe({
    ...recipe,
    beats: clampBeatCount(beats),
  });
}

export function getRecipeWithGrouping(
  recipe: RhythmRecipe,
  grouping: RhythmGrouping,
): RhythmRecipe {
  return getCompatibleRecipe({
    ...recipe,
    grouping,
  });
}

export function getRecipeWithGroove(
  recipe: RhythmRecipe,
  groove: RhythmGroove,
): RhythmRecipe {
  return getCompatibleRecipe({
    ...recipe,
    groove,
  });
}

export function getRecipeWithTimekeeper(
  recipe: RhythmRecipe,
  patch: Partial<{
    feel: RhythmTimekeeperFeel;
    sound: RhythmTimekeeperSound;
    subdivision: RhythmTimekeeperSubdivision;
  }>,
): RhythmRecipe {
  return getCompatibleRecipe({
    ...recipe,
    timekeeper: {
      ...recipe.timekeeper,
      ...patch,
    },
  });
}

export function isRhythmGrooveChoiceAvailable(
  recipe: RhythmRecipe,
  groove: RhythmGroove,
) {
  return rhythmGrooveSupportsBeatCount(groove, recipe.beats);
}

export function isRhythmTimekeeperSubdivisionChoiceAvailable(
  recipe: RhythmRecipe,
  choice: RhythmTimekeeperSubdivisionChoice,
) {
  return (
    recipe.timekeeper.feel !== "off" &&
    rhythmRecipeSupportsTimekeeperFeel(recipe.groove, recipe.beats, choice.feel)
  );
}

export function getRhythmBeatControlLabel(beats: number) {
  return `${beats} ${beats === 1 ? "Beat" : "Beats"}`;
}

export function getRhythmGroupingControlLabel(
  beats: number,
  grouping: RhythmGrouping,
) {
  return `Group beats as ${getRhythmGroupingChoiceLabel(beats, grouping)}`;
}

export function getRhythmTimekeeperSummary(recipe: RhythmRecipe) {
  if (recipe.timekeeper.feel === "off") {
    return "Off";
  }

  return formatValueSummary([
    getRhythmTimekeeperOptionLabel("sound", recipe.timekeeper),
    getRhythmTimekeeperRhythmReadoutLabel(recipe.timekeeper),
  ]);
}

export function getRhythmRecipeSummaryParts(recipe: RhythmRecipe) {
  const timekeeperOff = recipe.timekeeper.feel === "off";

  return {
    groove: getRhythmGrooveOptionLabel(recipe.groove),
    meter: getRhythmTheoryReadout(recipe).title,
    timekeeperRhythm: timekeeperOff
      ? "Off"
      : getRhythmTimekeeperRhythmReadoutLabel(recipe.timekeeper),
    timekeeperSound: timekeeperOff
      ? undefined
      : getRhythmTimekeeperOptionLabel("sound", recipe.timekeeper),
  };
}

export function getRhythmRecipeCreationSummary(recipe: RhythmRecipe) {
  const summary = getRhythmRecipeSummaryParts(recipe);

  return formatValueSummary([
    summary.meter,
    summary.groove,
    summary.timekeeperSound,
    summary.timekeeperRhythm,
  ]);
}
