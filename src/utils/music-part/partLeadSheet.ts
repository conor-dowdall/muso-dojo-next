import { rootAndNoteCollection } from "@musodojo/music-theory-data";
import { getRhythmTheoryReadout } from "@/data/rhythmPresets";
import { type MusicPartConfig } from "@/types/session";
import {
  getPartDurationChartUnits,
  isPartialPartDuration,
} from "@/utils/music-part/partDuration";
import {
  formatPartLengthBeats,
  getPartLengthBeats,
} from "@/utils/music-part/partLength";
import { getAutomaticRhythmSelection } from "@/utils/rhythm/automaticRhythm";
import { getRhythmSelectionRecipe } from "@/utils/rhythm/rhythmConfig";
import { isRhythmPartModule } from "@/utils/session/partModuleTypes";

export interface PartLeadSheetSummary {
  accessibleLabel: string;
  chartSpanUnits: number;
  id: string;
  identityAccessibleLabel: string;
  identityLabel: string;
  isPartialBar: boolean;
  lengthLabel: string;
  meterDetail: string;
  meterLabel: string;
}

export function getPartLeadSheetSummary(
  part: MusicPartConfig,
): PartLeadSheetSummary {
  const identity = rootAndNoteCollection.getIdentity(part);
  const rhythmModules = part.modules.filter(isRhythmPartModule);
  const lengthBeats = getPartLengthBeats(part);
  const rhythmSelection =
    rhythmModules[0]?.rhythm ??
    getAutomaticRhythmSelection(part.automaticRhythm, lengthBeats);
  const meterReadout = getRhythmTheoryReadout(
    getRhythmSelectionRecipe(rhythmSelection),
  );
  const layeredRhythm = rhythmModules.length > 1;
  const automaticSwing =
    rhythmModules.length === 0 && part.automaticRhythm === "swing";
  const meterLabel = layeredRhythm
    ? `${rhythmModules.length} Rhythms`
    : automaticSwing
      ? "Swing"
      : meterReadout.title;
  const meterDetail = [
    layeredRhythm
      ? "Layered rhythms"
      : rhythmModules.length === 0
        ? `${automaticSwing ? "Swing" : "Standard"} automatic rhythm`
        : meterReadout.detail,
    formatPartLengthBeats(lengthBeats),
  ]
    .filter(Boolean)
    .join(". ");

  return {
    accessibleLabel: [identity.accessibleLabel, meterLabel, meterDetail].join(
      ". ",
    ),
    chartSpanUnits: getPartDurationChartUnits(part.durationInBars),
    id: part.id,
    identityAccessibleLabel: identity.accessibleLabel,
    identityLabel: identity.label,
    isPartialBar: isPartialPartDuration(part.durationInBars),
    lengthLabel: formatPartLengthBeats(lengthBeats),
    meterDetail,
    meterLabel,
  };
}
