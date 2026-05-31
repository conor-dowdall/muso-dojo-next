import { type StringInstrumentKey } from "@musodojo/music-theory-data";
import { getDefaultFretboardVisualProfile } from "@/data/fretboard/instrumentDefaults";
import { type InstrumentIntrinsicSizing } from "@/types/instrument-layout";

const FRETBOARD_WIDTH_SIZING = {
  fretWidth: 54,
  minFretWidth: 34,
  minWidth: 280,
  trailingWidth: 18,
};

const PLAYABLE_STRING_ROW_HEIGHT = {
  fourOrFewerStrings: 30,
  fiveStrings: 27,
  sixOrMoreStrings: 24,
};

export interface FretboardSizingInput {
  instrument: StringInstrumentKey;
  numFrets: number;
  stringCount: number;
  showFretLabels: boolean;
}

export function getMinimumPlayableStringRowHeight(stringCount: number) {
  if (stringCount <= 4) {
    return PLAYABLE_STRING_ROW_HEIGHT.fourOrFewerStrings;
  }

  if (stringCount === 5) {
    return PLAYABLE_STRING_ROW_HEIGHT.fiveStrings;
  }

  return PLAYABLE_STRING_ROW_HEIGHT.sixOrMoreStrings;
}

export function createFretboardSizing({
  instrument,
  numFrets,
  stringCount,
  showFretLabels,
}: FretboardSizingInput): InstrumentIntrinsicSizing {
  const visualProfile = getDefaultFretboardVisualProfile(instrument);
  const fretLabelsHeight = showFretLabels ? visualProfile.fretLabelHeight : 0;
  const naturalHeight =
    stringCount * visualProfile.preferredStringRowHeight + fretLabelsHeight;
  const minimumPlayableHeight =
    stringCount * getMinimumPlayableStringRowHeight(stringCount) +
    fretLabelsHeight;

  return {
    preferredWidth: Math.max(
      FRETBOARD_WIDTH_SIZING.minWidth,
      numFrets * FRETBOARD_WIDTH_SIZING.fretWidth +
        FRETBOARD_WIDTH_SIZING.trailingWidth,
    ),
    preferredHeight: Math.max(naturalHeight, minimumPlayableHeight),
    minReadableWidth: Math.max(
      FRETBOARD_WIDTH_SIZING.minWidth,
      numFrets * FRETBOARD_WIDTH_SIZING.minFretWidth +
        FRETBOARD_WIDTH_SIZING.trailingWidth,
    ),
    minHeight: minimumPlayableHeight,
    maxHeight: Math.max(visualProfile.maxHeight, minimumPlayableHeight),
  };
}
