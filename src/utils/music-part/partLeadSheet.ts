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
import { getPartBandModule, getPartBandSource } from "./partBand";

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
  const lengthBeats = getPartLengthBeats(part);
  const rhythmSource = getPartBandSource(part, "rhythm");
  const selectedRhythm = getPartBandModule(part, "rhythm");
  const rhythmSelection =
    (selectedRhythm?.type === "rhythm" ? selectedRhythm.rhythm : undefined) ??
    getAutomaticRhythmSelection(part.automaticRhythm, lengthBeats);
  const meterReadout = getRhythmTheoryReadout(
    getRhythmSelectionRecipe(rhythmSelection),
  );
  const automaticSwing =
    rhythmSource.mode === "automatic" && part.automaticRhythm === "swing";
  const meterLabel =
    rhythmSource.mode === "off"
      ? "Rhythm Off"
      : automaticSwing
        ? "Swing"
        : meterReadout.title;
  const meterDetail = [
    rhythmSource.mode === "off"
      ? "No band rhythm"
      : rhythmSource.mode === "automatic"
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
