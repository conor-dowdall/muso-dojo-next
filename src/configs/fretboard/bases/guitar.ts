import { FretboardConfig } from "@/types/fretboard";
import { guitarTunings } from "@/configs/fretboard/tunings/guitar";

export const guitarBase: FretboardConfig = {
  tuning: guitarTunings["Standard E"],
  markerFrets: [3, 5, 7, 9, 12, 15, 17, 19, 21, 24],
  showNut: true,
  fretInlayDoubles: [12, 24],
  fretLabelDoubles: [12, 24],
  showStrings: true,
  showFretInlays: true,
  showFretLabels: true,
  showFretWires: true,
};
