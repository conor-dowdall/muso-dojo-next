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

export const rhythmTimekeeperSoundChoices = [
  {
    label: "Turn timekeeper off",
    sound: undefined,
    text: "Off",
  },
  {
    label: "Use closed hi-hat timekeeper",
    sound: "hat",
    text: "Hat",
  },
  {
    label: "Use ride cymbal timekeeper",
    sound: "ride",
    text: "Ride",
  },
  {
    label: "Use shaker timekeeper",
    sound: "shaker",
    text: "Shk",
  },
] as const satisfies readonly {
  label: string;
  sound: RhythmTimekeeperSound | undefined;
  text: string;
}[];

export const rhythmGrooveChoices = [
  {
    groove: "pulse",
    label: "Use bass drum pulse on the counted beats",
    text: "Pulse",
  },
  {
    groove: "kit",
    label: "Use kick and snare kit foundation",
    text: "Kit",
  },
  {
    groove: "bluegrass",
    label: "Use bluegrass-style offbeat snare drive",
    text: "Drive",
  },
] as const satisfies readonly {
  groove: RhythmGroove;
  label: string;
  text: string;
}[];

export const rhythmTimekeeperSubdivisionChoices = [
  {
    label: "Use one subdivision per beat",
    text: "1",
    feel: "straight",
    subdivision: "quarter",
  },
  {
    label: "Use two subdivisions per beat",
    text: "2",
    feel: "straight",
    subdivision: "eighth",
  },
  {
    label: "Use three subdivisions per beat",
    text: "3",
    feel: "triplet",
    subdivision: "eighth",
  },
  {
    label: "Use four subdivisions per beat",
    text: "4",
    feel: "straight",
    subdivision: "sixteenth",
  },
  {
    label: "Use swing eighths timekeeper pattern",
    text: "Sw",
    feel: "swing",
    subdivision: "eighth",
  },
  {
    label: "Use shuffle eighths timekeeper pattern",
    text: "Shf",
    feel: "shuffle",
    subdivision: "eighth",
  },
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
      feel: "triplet",
      subdivision: "eighth",
    },
  },
  "12-8": {
    ...DEFAULT_RHYTHM_RECIPE,
    beats: 4,
    timekeeper: {
      ...DEFAULT_RHYTHM_RECIPE.timekeeper,
      feel: "triplet",
      subdivision: "eighth",
    },
  },
  shuffle: {
    ...DEFAULT_RHYTHM_RECIPE,
    timekeeper: {
      ...DEFAULT_RHYTHM_RECIPE.timekeeper,
      feel: "shuffle",
      sound: "hat",
      subdivision: "eighth",
    },
  },
  swing: {
    ...DEFAULT_RHYTHM_RECIPE,
    timekeeper: {
      ...DEFAULT_RHYTHM_RECIPE.timekeeper,
      feel: "swing",
      sound: "ride",
      subdivision: "eighth",
    },
  },
  country: {
    ...DEFAULT_RHYTHM_RECIPE,
    groove: "bluegrass",
    timekeeper: {
      ...DEFAULT_RHYTHM_RECIPE.timekeeper,
      feel: "straight",
      sound: "hat",
      subdivision: "eighth",
    },
  },
} satisfies Record<RhythmStarterId, RhythmRecipe>;

function clampBeatCount(beats: number) {
  return Math.min(RHYTHM_MAX_BEATS, Math.max(RHYTHM_MIN_BEATS, beats));
}

function getCompatibleRecipe(recipe: RhythmRecipe) {
  return normalizeRhythmRecipe(recipe);
}

export function getRhythmStarterRecipe(starterId: RhythmStarterId) {
  return getCompatibleRecipe(rhythmStarterRecipes[starterId]);
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

export function getRhythmRecipeCreationSummary(recipe: RhythmRecipe) {
  return formatValueSummary([
    getRhythmTheoryReadout(recipe).title,
    getRhythmGrooveOptionLabel(recipe.groove),
    getRhythmTimekeeperSummary(recipe),
  ]);
}
