import {
  type AutomaticRhythmConfig,
  type ExerciseLooperPartModuleConfig,
  type MusicPartConfig,
  type PartBandConfig,
  type PartBandSourceConfig,
  type PartModuleConfig,
  type RhythmPartModuleConfig,
  type SessionBackingBandConfig,
} from "@/types/session";
import { getAutomaticRhythmSelection } from "@/utils/rhythm/automaticRhythm";
import {
  getRhythmSelectionRecipe,
  type RhythmSelection,
} from "@/utils/rhythm/rhythmConfig";
import { getSessionBackingBandConfig } from "@/utils/session/sessionBackingBand";
import { getPartBandConfig, getPartBandModules } from "./partBand";

export const DEFAULT_PART_LENGTH_BEATS = 4;
export const MIN_PART_LENGTH_BEATS = 0.125;
export const MAX_PART_LENGTH_BEATS = 128;
const PART_LENGTH_PRECISION = 1_000_000;

export interface PartBackingBandInput {
  automaticRhythm?: AutomaticRhythmConfig;
  band?: PartBandConfig;
  durationInBars?: number;
  modules?: readonly PartModuleConfig[];
}

interface ResolvedBackingBandLane<
  TModule extends ExerciseLooperPartModuleConfig | RhythmPartModuleConfig,
> {
  enabled: boolean;
  module?: TModule;
  source: PartBandSourceConfig;
}

export interface ResolvedPartBackingBand {
  backingNotes: ResolvedBackingBandLane<ExerciseLooperPartModuleConfig>;
  band: PartBandConfig;
  durationBeats: number;
  perPartDurationBeats: number;
  rhythm: ResolvedBackingBandLane<RhythmPartModuleConfig> & {
    selection: RhythmSelection;
  };
  session: SessionBackingBandConfig;
}

function roundPartLength(value: number) {
  return Math.round(value * PART_LENGTH_PRECISION) / PART_LENGTH_PRECISION;
}

export function normalizePartLengthBeats(value: unknown) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < MIN_PART_LENGTH_BEATS ||
    value > MAX_PART_LENGTH_BEATS
  ) {
    return undefined;
  }

  return roundPartLength(value);
}

export function getPerPartRhythmBeats(part: PartBackingBandInput) {
  return (
    normalizePartLengthBeats(
      part.durationInBars === undefined
        ? undefined
        : part.durationInBars * DEFAULT_PART_LENGTH_BEATS,
    ) ?? DEFAULT_PART_LENGTH_BEATS
  );
}

function findSelectedModule<TModule extends PartModuleConfig>(
  modules: readonly TModule[],
  source: PartBandSourceConfig,
) {
  return source.mode === "module"
    ? modules.find((module) => module.id === source.moduleId)
    : undefined;
}

export function resolvePartBackingBand(
  input: PartBackingBandInput,
  sessionBackingBand?: SessionBackingBandConfig,
): ResolvedPartBackingBand {
  const modules = input.modules ?? [];
  const part = { band: input.band, modules: [...modules] } satisfies Pick<
    MusicPartConfig,
    "band" | "modules"
  >;
  const band = getPartBandConfig(part);
  const session = getSessionBackingBandConfig(sessionBackingBand);
  const backingNotesModule = findSelectedModule(
    getPartBandModules(modules, "backingNotes"),
    band.backingNotes,
  );
  const rhythmModule = findSelectedModule(
    getPartBandModules(modules, "rhythm"),
    band.rhythm,
  );
  const selectedBackingNotesModule =
    backingNotesModule?.type === "exercise-looper"
      ? backingNotesModule
      : undefined;
  const selectedRhythmModule =
    rhythmModule?.type === "rhythm" ? rhythmModule : undefined;
  const perPartDurationBeats = getPerPartRhythmBeats(input);
  const durationBeats = selectedRhythmModule
    ? getRhythmSelectionRecipe(selectedRhythmModule.rhythm).beats
    : band.rhythm.mode === "session" && session.rhythm.mode === "custom"
      ? getRhythmSelectionRecipe(session.rhythm.selection).beats
      : perPartDurationBeats;
  const rhythmSelection =
    selectedRhythmModule?.rhythm ??
    (band.rhythm.mode === "session" && session.rhythm.mode === "custom"
      ? session.rhythm.selection
      : getAutomaticRhythmSelection(
          input.automaticRhythm?.style,
          durationBeats,
        ));

  return {
    backingNotes: {
      enabled:
        band.backingNotes.mode === "module" ||
        (band.backingNotes.mode === "session" && session.looper.enabled),
      ...(selectedBackingNotesModule
        ? { module: selectedBackingNotesModule }
        : {}),
      source: band.backingNotes,
    },
    band,
    durationBeats,
    perPartDurationBeats,
    rhythm: {
      enabled:
        band.rhythm.mode === "module" ||
        (band.rhythm.mode === "session" && session.rhythm.mode !== "off"),
      ...(selectedRhythmModule ? { module: selectedRhythmModule } : {}),
      selection: rhythmSelection,
      source: band.rhythm,
    },
    session,
  };
}
