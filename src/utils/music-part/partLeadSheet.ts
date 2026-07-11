import { rootAndNoteCollection } from "@musodojo/music-theory-data";
import { getRhythmTheoryReadout } from "@/data/rhythmPresets";
import {
  type MusicPartConfig,
  type SessionBackingBandConfig,
} from "@/types/session";
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
  meterDetail: string;
  meterLabel: string;
}

export function getPartLeadSheetSummary(
  part: MusicPartConfig,
  backingBand?: SessionBackingBandConfig,
): PartLeadSheetSummary {
  const identity = rootAndNoteCollection.getIdentity(part);
  const lengthBeats = getPartLengthBeats(part, backingBand);
  const rhythmSource = getPartBandSource(part, "rhythm");
  const selectedRhythm = getPartBandModule(part, "rhythm");
  const rhythmSelection =
    (selectedRhythm?.type === "rhythm" ? selectedRhythm.rhythm : undefined) ??
    (rhythmSource.mode === "session" && backingBand?.rhythm.mode === "custom"
      ? backingBand.rhythm.selection
      : getAutomaticRhythmSelection(part.automaticRhythm?.style, lengthBeats));
  const meterReadout = getRhythmTheoryReadout(
    getRhythmSelectionRecipe(rhythmSelection),
  );
  const sessionRhythmDescription =
    backingBand?.rhythm.mode === "custom"
      ? meterReadout.detail
      : `${
          part.automaticRhythm?.style === "swing" ? "Swing" : "Straight"
        } Session rhythm`;
  const meterLabel = meterReadout.title;
  const meterDetail = [
    rhythmSource.mode === "off"
      ? "No band rhythm"
      : rhythmSource.mode === "session"
        ? sessionRhythmDescription
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
    meterDetail,
    meterLabel,
  };
}
