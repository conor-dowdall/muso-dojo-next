"use client";

import type { FretboardProps } from "@/types/fretboard";
import { createFretboardConfig } from "@/utils/createFretboardConfig";
import { calculateFretboardGridColumns } from "@/utils/calculateFretboardGridColumns";
import { getNumFrets } from "@/utils/fretboard";
import Fret from "./Fret";

export default function Fretboard({
  config = {},
  preset,
  ...rest
}: FretboardProps) {
  const resolvedConfig = createFretboardConfig(preset, { ...config, ...rest });
  const numFrets = getNumFrets(resolvedConfig.fretRange);
  const fretboardGridColumns = calculateFretboardGridColumns(
    numFrets,
    resolvedConfig.evenFrets,
  );
  const startFret = resolvedConfig.fretRange[0];

  return (
    <div
      id="fretboard-wrapper"
      style={{
        width: "100%",
        height: "100%",
        display: "grid",
        containerType: "inline-size",
        gridTemplateRows:
          resolvedConfig.fretLabelsPosition === "bottom"
            ? "1fr max-content"
            : "max-content 1fr",
        gridTemplateColumns: fretboardGridColumns,
      }}
    >
      <div
        id="fingerboard"
        style={{
          display: "grid",
          gridTemplateColumns: "subgrid",
          gridColumn: "1 / -1",
          gridRow:
            resolvedConfig.fretLabelsPosition === "bottom" ? "1 / 2" : "2 / -1",
          background: resolvedConfig.background,
        }}
      >
        {Array.from({ length: numFrets }).map((_, i) => (
          <Fret key={i} fretNumber={startFret + i} config={resolvedConfig} />
        ))}
      </div>

      <div
        id="fret-labels"
        style={{
          display: "grid",
          height: resolvedConfig.fretLabelsHeight,
          background: resolvedConfig.freLabelsBackground,
          gridTemplateColumns: "subgrid",
          gridColumn: "1 / -1",
          gridRow:
            resolvedConfig.fretLabelsPosition === "bottom" ? "2 / -1" : "1 / 2",
        }}
      >
        {Array.from({ length: numFrets }).map((_, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              overflow: "visible",
            }}
          >
            <span
              style={{
                fontSize: `calc(${resolvedConfig.fretLabelsHeight})`,
                textBoxTrim: "trim-both",
                textBoxEdge: "cap alphabetic",
                color: resolvedConfig.fretLabelsColor,
              }}
            >
              {resolvedConfig.markerFrets.includes(startFret + i)
                ? startFret + i
                : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
