import { type CSSProperties } from "react";
import {
  type FretboardGeometry,
  type FretboardNoteCellInfo,
  type ResolvedFretboardConfig,
} from "@/types/fretboard";
import {
  calculateFretboardGridColumns,
  getNumFrets,
} from "@/utils/fretboard/fretboardGeometry";
import { createFretboardSizing } from "@/utils/fretboard/createFretboardSizing";

export function createFretboardGeometry(
  config: ResolvedFretboardConfig,
): FretboardGeometry {
  const numFrets = getNumFrets(config.fretRange);
  const fretboardGridColumns = calculateFretboardGridColumns(
    numFrets,
    config.evenFrets,
  );
  const isFretLabelsBottom = config.fretLabelsPosition === "bottom";
  const mainContentGridRow = config.showFretLabels
    ? isFretLabelsBottom
      ? "1 / 2"
      : "2 / -1"
    : "1 / -1";
  const fretLabelsGridRow = isFretLabelsBottom ? "2 / -1" : "1 / 2";

  const fretNumbers = Array.from(
    { length: numFrets },
    (_, i) => config.fretRange[0] + i,
  );
  const stringIndices = config.tuning.map((_, i) => i);
  const sizing = createFretboardSizing({
    instrument: config.instrument,
    numFrets,
    stringCount: stringIndices.length,
    showFretLabels: config.showFretLabels,
  });

  const noteCells: FretboardNoteCellInfo[] = [];
  config.tuning.forEach((openStringMidi, stringIndex) => {
    fretNumbers.forEach((fretNumber, fretIndex) => {
      noteCells.push({
        key: `${stringIndex}-${fretNumber}`,
        midi: openStringMidi + fretNumber,
        stringIndex,
        fretNumber,
        fretIndex,
        style: {
          gridColumn: `${fretIndex + 1} / span 1`,
          gridRow: `${stringIndex + 1} / span 1`,
        } as CSSProperties,
      });
    });
  });

  const markerSet = new Set(config.markerFrets);
  const doubleInlaySet = new Set(config.fretInlayDoubles);
  const doubleLabelSet = new Set(config.fretLabelDoubles);

  return {
    ...config,
    numFrets,
    fretboardGridColumns,
    isFretLabelsBottom,
    mainContentGridRow,
    fretLabelsGridRow,
    fretNumbers,
    stringIndices,
    noteCells,
    sizing,
    isMarker: (fret: number) => markerSet.has(fret),
    isDoubleInlay: (fret: number) => doubleInlaySet.has(fret),
    isDoubleLabel: (fret: number) => doubleLabelSet.has(fret),
  };
}
