import { rootAndNoteCollection } from "@musodojo/music-theory-data";
import { getRhythmTheoryReadout } from "@/data/rhythmPresets";
import { type MusicPartConfig } from "@/types/session";
import {
  getPartDurationChartUnits,
  getRhythmSelectionForPartDuration,
  isPartialPartDuration,
} from "@/utils/music-part/partDuration";
import { getRhythmSelectionRecipe } from "@/utils/rhythm/rhythmConfig";
import { isRhythmPartModule } from "@/utils/session/partModuleTypes";

export interface PartLeadSheetSummary {
  accessibleLabel: string;
  chartSpanUnits: number;
  id: string;
  identityAccessibleLabel: string;
  identityLabel: string;
  isPartialBar: boolean;
  meterDetail: string;
  meterLabel: string;
}

function getFirstRhythmModule(part: MusicPartConfig) {
  return part.modules.find(isRhythmPartModule);
}

export function getPartLeadSheetSummary(
  part: MusicPartConfig,
): PartLeadSheetSummary {
  const identity = rootAndNoteCollection.getIdentity(part);
  const rhythmModule = getFirstRhythmModule(part);
  const rhythmSelection =
    rhythmModule?.rhythm ??
    getRhythmSelectionForPartDuration(part.durationInBars);
  const meterReadout = getRhythmTheoryReadout(
    getRhythmSelectionRecipe(rhythmSelection),
  );

  return {
    accessibleLabel: [
      identity.accessibleLabel,
      meterReadout.title,
      meterReadout.detail,
    ].join(". "),
    chartSpanUnits: getPartDurationChartUnits(part.durationInBars),
    id: part.id,
    identityAccessibleLabel: identity.accessibleLabel,
    identityLabel: identity.label,
    isPartialBar: isPartialPartDuration(part.durationInBars),
    meterDetail: meterReadout.detail,
    meterLabel: meterReadout.title,
  };
}
