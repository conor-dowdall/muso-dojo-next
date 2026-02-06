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
  const cfg = createFretboardConfig(preset, { ...config, ...rest });
  const numFrets = getNumFrets(cfg.fretRange);
  const fretboardGridColumns = calculateFretboardGridColumns(
    numFrets,
    cfg.evenFrets,
  );
  const startFret = cfg.fretRange[0];

  return (
    // This div represents the main wrapper for the fretboard and the fret-labels
    <div
      style={{
        width: "20em",
        height: "10em",
        display: "grid",
        gridTemplateRows: "1fr max-content", // Default layout for fretboard and labels
        gridTemplateColumns: fretboardGridColumns, // Apply the calculated grid columns here
        // You might add other host-level styles here, e.g., resize, overflow
      }}
    >
      <div
        id="fretboard"
        style={{
          display: "grid",
          gridTemplateColumns: "subgrid",
          gridColumn: "1 / -1",
          gridRow: "1 / 2",
        }}
      >
        {Array.from({ length: numFrets }).map((_, i) => (
          <Fret key={i} fretNumber={startFret + i} theme={cfg.theme} />
        ))}
      </div>

      <div
        id="fret-labels"
        style={{
          display: "grid",
          gridTemplateColumns: "subgrid",
          gridColumn: "1 / -1",
          gridRow: "2 / 3",
        }}
      ></div>
    </div>
  );
}
