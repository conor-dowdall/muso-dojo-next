import { getRhythmTheoryReadout } from "@/data/rhythmPresets";
import { type MusicPartConfig } from "@/types/session";
import { getPartIdentity } from "@/utils/music-theory/partIdentity";
import {
  PART_DURATION_BEATS_PER_BAR,
  formatPartDurationInBars,
  getRepresentablePartDurationBeats,
  getRhythmSelectionForPartDuration,
} from "@/utils/music-part/partDuration";
import { getRhythmSelectionRecipe } from "@/utils/rhythm/rhythmConfig";
import { isRhythmPartModule } from "@/utils/session/partModuleTypes";

export interface PartLeadSheetSummary {
  accessibleLabel: string;
  durationLabel?: string;
  id: string;
  identityAccessibleLabel: string;
  identityLabel: string;
  meterDetail: string;
  meterLabel: string;
}

function getFirstRhythmModule(part: MusicPartConfig) {
  return part.modules.find(isRhythmPartModule);
}

function getMeterLabelForDurationBeats(durationBeats: number | undefined) {
  if (durationBeats === undefined) {
    return undefined;
  }

  const recipe = getRhythmSelectionForPartDuration(
    durationBeats / PART_DURATION_BEATS_PER_BAR,
  ).recipe;

  return getRhythmTheoryReadout(recipe).title;
}

function getDurationLabel({
  durationInBars,
  meterLabel,
}: {
  durationInBars: number | undefined;
  meterLabel: string;
}) {
  const durationBeats = getRepresentablePartDurationBeats(durationInBars);
  const defaultMeterLabel = getMeterLabelForDurationBeats(durationBeats);

  return defaultMeterLabel === meterLabel
    ? formatPartDurationInBars(durationInBars)
    : undefined;
}

export function getPartLeadSheetSummary(
  part: MusicPartConfig,
): PartLeadSheetSummary {
  const identity = getPartIdentity(part);
  const rhythmModule = getFirstRhythmModule(part);
  const rhythmSelection =
    rhythmModule?.rhythm ??
    getRhythmSelectionForPartDuration(part.durationInBars);
  const meterReadout = getRhythmTheoryReadout(
    getRhythmSelectionRecipe(rhythmSelection),
  );
  const durationLabel = getDurationLabel({
    durationInBars: part.durationInBars,
    meterLabel: meterReadout.title,
  });
  const chartDetails = [meterReadout.title, durationLabel].filter(
    (detail): detail is string => Boolean(detail),
  );

  return {
    accessibleLabel: [
      identity.accessibleLabel,
      ...chartDetails,
      meterReadout.detail,
    ].join(". "),
    ...(durationLabel ? { durationLabel } : {}),
    id: part.id,
    identityAccessibleLabel: identity.accessibleLabel,
    identityLabel: identity.label,
    meterDetail: meterReadout.detail,
    meterLabel: meterReadout.title,
  };
}
