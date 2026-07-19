import { type AutomaticRhythmStyle } from "@/types/session";
import {
  DEFAULT_RHYTHM_RECIPE,
  normalizeRhythmSelection,
  type RhythmSelection,
} from "@/utils/rhythm/rhythmConfig";
import { getRhythmSelectionForBeatCount } from "@/utils/music-part/partDuration";

const automaticRhythmSelections = {
  standard: normalizeRhythmSelection({
    recipe: DEFAULT_RHYTHM_RECIPE,
    source: "recipe",
  }),
  swing: normalizeRhythmSelection({
    recipe: {
      ...DEFAULT_RHYTHM_RECIPE,
      timekeeper: {
        ...DEFAULT_RHYTHM_RECIPE.timekeeper,
        feel: "swing",
        sound: "ride",
        subdivision: "2-per-beat",
      },
    },
    source: "recipe",
  }),
} as const satisfies Record<AutomaticRhythmStyle, RhythmSelection>;

export function getAutomaticRhythmSelection(
  style: AutomaticRhythmStyle | undefined,
  lengthBeats?: number,
) {
  return getRhythmSelectionForBeatCount(
    lengthBeats,
    automaticRhythmSelections[style ?? "standard"],
  );
}
