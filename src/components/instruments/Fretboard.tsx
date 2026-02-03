"use client";

import type { FretboardConfig } from "@/types/fretboard";
import { useFretboardConfig } from "@/hooks/useFretboardConfig";
import { useFretboardGridColumns } from "@/hooks/useFretboardGridColumns";
import type { FretboardPresetName } from "@/configs/fretboard/presets/index";

export interface FretboardProps extends Partial<FretboardConfig> {
  config?: Partial<FretboardConfig>;
  preset?: FretboardPresetName;
}

export function Fretboard({ config = {}, preset, ...rest }: FretboardProps) {
  const cfg = useFretboardConfig(preset, { ...config, ...rest });
  const fretboardGridColumns = useFretboardGridColumns(cfg);

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
          gridColumn: 1 / -1,
          gridRow: 1 / 2,
        }}
      ></div>

      <div
        id="fret-labels"
        style={{
          display: "grid",
          gridTemplateColumns: "subgrid",
          gridColumn: 1 / -1,
          gridRow: 2 / 3,
        }}
      ></div>
    </div>
  );
}
