"use client";

import type { FretboardProps } from "@/types/fretboard";
import { createFretboardConfig } from "@/utils/createFretboardConfig";
import { calculateFretboardGridColumns } from "@/utils/calculateFretboardGridColumns";
import { getNumFrets } from "@/utils/fretboard";
import Fret from "./Fret";
import FretLabel from "./FretLabel";
import InstrumentString from "./InstrumentString";

export default function Fretboard({
  config = {},
  preset,
  ...rest
}: FretboardProps) {
  const resolvedConfig = createFretboardConfig(preset, { ...config, ...rest });

  const tuning = resolvedConfig.tuning;
  const fretRange = resolvedConfig.fretRange;

  const numFrets = getNumFrets(fretRange);
  const startFret = fretRange[0];
  const fretboardGridColumns = calculateFretboardGridColumns(
    numFrets,
    resolvedConfig.evenFrets,
  );

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
        direction: resolvedConfig.leftHanded ? "rtl" : "ltr",
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
        id="strings-container"
        style={{
          gridColumn: "1 / -1",
          gridRow:
            resolvedConfig.fretLabelsPosition === "bottom" ? "1 / 2" : "2 / -1",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {tuning.map((_: number, i: number) => (
          <InstrumentString
            key={i}
            stringNumber={i + 1}
            config={resolvedConfig}
          />
        ))}
      </div>

      <div
        id="fret-labels"
        style={{
          display: "grid",
          height: resolvedConfig.fretLabelsHeight,
          background: resolvedConfig.fretLabelsBackground,
          gridTemplateColumns: "subgrid",
          gridColumn: "1 / -1",
          gridRow:
            resolvedConfig.fretLabelsPosition === "bottom" ? "2 / -1" : "1 / 2",
        }}
      >
        {Array.from({ length: numFrets }).map((_, i) => (
          <FretLabel
            key={i}
            fretNumber={startFret + i}
            config={resolvedConfig}
          />
        ))}
      </div>
    </div>
  );
}
