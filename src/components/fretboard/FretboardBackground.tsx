import { useFretboardConfig } from "@/context/fretboard/FretboardContext";
import { getNumFrets } from "@/utils/fretboard/getNumFrets";
import Fret from "./Fret";
import FretLabel from "./FretLabel";
import InstrumentString from "./InstrumentString";
import styles from "./Fretboard.module.css";

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
    <div data-component="FretboardBackground" className={styles.subgridOverlay}>
      <div
        data-id="fretboard-fingerboard-area"
        className={styles.fingerboardArea}
        style={
          {
            gridRow: mainContentGridRow,
            "--fretboard-bg": config.background,
          } as React.CSSProperties
        }
      >
        {Array.from({ length: numFrets }).map((_, fretIndex) => (
          <Fret key={fretIndex} fretNumber={startFret + fretIndex} />
        ))}
      </div>

      <div
        data-id="fretboard-strings-area"
        className={styles.stringsArea}
        style={
          {
            gridRow: mainContentGridRow,
          } as React.CSSProperties
        }
      >
        {tuning.map((_: number, stringIndex: number) => (
          <InstrumentString key={stringIndex} stringNumber={stringIndex + 1} />
        ))}
      </div>

      <div
        data-id="fretboard-fret-labels-area"
        className={styles.labelsArea}
        style={
          {
            gridRow: fretLabelsGridRow,
            "--labels-height": config.fretLabelsHeight,
            "--labels-bg": config.fretLabelsBackground,
          } as React.CSSProperties
        }
      >
        {Array.from({ length: numFrets }).map((_, i) => (
          <FretLabel key={i} fretNumber={startFret + i} />
        ))}
      </div>
    </div>
  );
}
