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
import { formatPartLengthBeats } from "@/utils/music-part/partLength";
import { getRhythmSelectionRecipe } from "@/utils/rhythm/rhythmConfig";
import { resolvePartBackingBand } from "./resolvePartBackingBand";

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
  const resolvedBand = resolvePartBackingBand(part, backingBand);
  const lengthBeats = resolvedBand.durationBeats;
  const meterReadout = getRhythmTheoryReadout(
    getRhythmSelectionRecipe(resolvedBand.rhythm.selection),
  );
  const sessionRhythmDescription =
    resolvedBand.session.rhythm.mode === "custom"
      ? meterReadout.detail
      : `${
          part.automaticRhythm?.style === "swing" ? "Swing" : "Straight"
        } Session rhythm`;
  const meterLabel = meterReadout.title;
  const meterDetail = [
    !resolvedBand.rhythm.enabled
      ? "No band rhythm"
      : resolvedBand.rhythm.source.mode === "session"
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
