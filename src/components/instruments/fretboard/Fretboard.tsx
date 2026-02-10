"use client";

import { createFretboardConfig } from "@/utils/fretboard/createFretboardConfig";
import { calculateFretboardGridColumns } from "@/utils/fretboard/calculateFretboardGridColumns";
import { getNumFrets } from "@/utils/fretboard/getNumFrets";
import Fret from "./Fret";
import FretLabel from "./FretLabel";
import InstrumentString from "./InstrumentString";
import FretboardNote from "./FretboardNote";
import { ActiveNote, FretboardProps } from "@/types/fretboard";

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
        id="notes-container"
        style={{
          gridColumn: "1 / -1",
          gridRow:
            resolvedConfig.fretLabelsPosition === "bottom" ? "1 / 2" : "2 / -1",
          display: "grid",
          gridTemplateColumns: "subgrid",
          gridTemplateRows: `repeat(${tuning.length}, 1fr)`,
          pointerEvents: "none",
        }}
      >
        {tuning.map((openStringMidi, stringIndex) =>
          Array.from({ length: numFrets }).map((_, fretIndex) => {
            const fretNumber = startFret + fretIndex;
            const key = `${stringIndex}-${fretNumber}`;
            const note = rest.activeNotes?.[key];

            return (
              <div
                key={key}
                style={{
                  gridColumn: `${fretIndex + 1} / span 1`,
                  gridRow: `${stringIndex + 1} / span 1`,
                  position: "relative",
                  pointerEvents: "auto",
                }}
                onClick={() => {
                  if (rest.onActiveNotesChange && rest.activeNotes) {
                    // Toggle logic
                    // Logic: Undefined -> Large -> Small -> Undefined
                    const current = rest.activeNotes[key];
                    let next: ActiveNote | undefined = undefined;

                    if (!current) {
                      next = {
                        midi: openStringMidi + fretNumber,
                        emphasis: "large",
                      };
                    } else if (current.emphasis === "large") {
                      next = { ...current, emphasis: "small" };
                    }

                    const newNotes = { ...rest.activeNotes };
                    if (next) {
                      newNotes[key] = next;
                    } else {
                      delete newNotes[key];
                    }

                    rest.onActiveNotesChange(newNotes);
                  }
                }}
              >
                {note && <FretboardNote note={note} />}
              </div>
            );
          }),
        )}
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
