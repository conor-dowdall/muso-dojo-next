import { audioPresets, getDefaultAudioPresetId } from "@/audio";
import { formatExerciseOctave } from "@/components/exercise-looper/ExerciseVoiceDisclosureItems";
import {
  getRhythmRecipeCreationSummary,
  getRhythmRecipeSummaryParts,
} from "@/components/rhythm/rhythmRecipeControls";
import {
  type AutomaticRhythmStyle,
  type ExerciseLooperPartModuleConfig,
  type MusicPartConfig,
  type PartBandRole,
  type SessionBackingBandConfig,
} from "@/types/session";
import { DEFAULT_EXERCISE_OCTAVE_OFFSET } from "@/utils/exercise-looper/exerciseConfig";
import { getAutomaticRhythmSelection } from "@/utils/rhythm/automaticRhythm";
import { getRhythmSelectionRecipe } from "@/utils/rhythm/rhythmConfig";
import { getPartBandSource } from "@/utils/music-part/partBand";
import { formatValueSummary } from "@/utils/valueSummary";

type BackingNotesConfig =
  | Pick<SessionBackingBandConfig["looper"], "audioPresetId" | "octaveOffset">
  | Pick<ExerciseLooperPartModuleConfig, "audioPresetId" | "octaveOffset">;

export function getBackingNotesSummary(config: BackingNotesConfig) {
  const audioPresetId =
    config.audioPresetId ?? getDefaultAudioPresetId("exercise");

  return formatValueSummary([
    audioPresets[audioPresetId].label,
    formatExerciseOctave(config.octaveOffset ?? DEFAULT_EXERCISE_OCTAVE_OFFSET),
  ]);
}

export function getBackingRhythmSummary(
  selection: SessionBackingBandConfig["rhythm"]["selection"],
) {
  return getRhythmRecipeCreationSummary(getRhythmSelectionRecipe(selection));
}

function formatCount(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function getSessionBandCoverageSummary(
  parts: readonly MusicPartConfig[],
  role: PartBandRole,
) {
  if (parts.length === 0) {
    return "No Parts in Session";
  }

  const counts = {
    module: 0,
    off: 0,
    session: 0,
  };

  parts.forEach((part) => {
    counts[getPartBandSource(part, role).mode] += 1;
  });

  const appliesTo =
    counts.session === parts.length && parts.length > 1
      ? `Applies to all ${formatCount(parts.length, "Part", "Parts")}`
      : `Applies to ${formatCount(counts.session, "Part", "Parts")}`;
  const localModule =
    role === "backingNotes"
      ? formatCount(counts.module, "local Looper", "local Loopers")
      : formatCount(counts.module, "local Rhythm", "local Rhythms");
  const off =
    role === "backingNotes"
      ? formatCount(counts.off, "Backing Notes Off", "Backing Notes Off")
      : formatCount(counts.off, "Rhythm Off", "Rhythm Off");

  return formatValueSummary([
    appliesTo,
    counts.module > 0 ? localModule : undefined,
    counts.off > 0 ? off : undefined,
  ]);
}

function joinAlternatives(values: readonly (string | undefined)[]) {
  return Array.from(
    new Set(values.filter((value): value is string => value !== undefined)),
  ).join(" or ");
}

export function getBandChoosesRhythmSummary(parts: readonly MusicPartConfig[]) {
  const routedParts = parts.filter(
    (part) => getPartBandSource(part, "rhythm").mode === "session",
  );
  const styles: AutomaticRhythmStyle[] = routedParts.map(
    (part) => part.automaticRhythm?.style ?? "standard",
  );
  const effectiveStyles: AutomaticRhythmStyle[] =
    styles.length > 0 ? styles : ["standard", "swing"];
  const summaries = effectiveStyles.map((style) =>
    getRhythmRecipeSummaryParts(
      getRhythmSelectionRecipe(getAutomaticRhythmSelection(style)),
    ),
  );

  return formatValueSummary([
    joinAlternatives(summaries.map((summary) => summary.groove)),
    joinAlternatives(summaries.map((summary) => summary.timekeeperSound)),
    joinAlternatives(summaries.map((summary) => summary.timekeeperRhythm)),
  ]);
}
