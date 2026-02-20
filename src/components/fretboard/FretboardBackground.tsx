import { useFretboardConfig } from "@/context/fretboard/FretboardContext";
import { getNumFrets } from "@/utils/fretboard/getNumFrets";
import Fret from "./Fret";
import FretLabel from "./FretLabel";
import InstrumentString from "./InstrumentString";

export default function FretboardBackground() {
  const config = useFretboardConfig();

  const tuning = config.tuning;
  const fretRange = config.fretRange;
  const numFrets = getNumFrets(fretRange);
  const startFret = fretRange[0];

  const isFretLabelsBottom = config.fretLabelsPosition === "bottom";
  const mainContentGridRow = isFretLabelsBottom ? "1 / 2" : "2 / -1";
  const fretLabelsGridRow = isFretLabelsBottom ? "2 / -1" : "1 / 2";

  return (
    <div
      style={{
        display: "grid",
        gridColumn: "1 / -1",
        gridRow: "1 / -1",
        gridTemplateRows: "subgrid",
        gridTemplateColumns: "subgrid",
        pointerEvents: "none",
      }}
    >
      <div
        id="fingerboard"
        style={{
          display: "grid",
          gridTemplateColumns: "subgrid",
          gridColumn: "1 / -1",
          gridRow: mainContentGridRow,
          background: config.background,
        }}
      >
        {Array.from({ length: numFrets }).map((_, fretIndex) => (
          <Fret key={fretIndex} fretNumber={startFret + fretIndex} />
        ))}
      </div>

      <div
        id="strings-container"
        style={{
          gridColumn: "1 / -1",
          gridRow: mainContentGridRow,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {tuning.map((_: number, stringIndex: number) => (
          <InstrumentString key={stringIndex} stringNumber={stringIndex + 1} />
        ))}
      </div>

      <div
        id="fret-labels"
        style={{
          display: "grid",
          height: config.fretLabelsHeight,
          background: config.fretLabelsBackground,
          gridTemplateColumns: "subgrid",
          gridColumn: "1 / -1",
          gridRow: fretLabelsGridRow,
          pointerEvents: "auto", // Re-enable pointer events if labels are interactive (unlikely but safe)
        }}
      >
        {Array.from({ length: numFrets }).map((_, i) => (
          <FretLabel key={i} fretNumber={startFret + i} />
        ))}
      </div>
    </div>
  );
}
