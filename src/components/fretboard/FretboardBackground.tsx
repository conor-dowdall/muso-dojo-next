import { type CSSProperties } from "react";
import { useFretboardGeometry } from "./FretboardContext";
import { Fret } from "./Fret";
import { FretLabel } from "./FretLabel";
import { InstrumentString } from "./InstrumentString";
import styles from "./Fretboard.module.css";

export function FretboardBackground() {
  const geometry = useFretboardGeometry();
  const { fretNumbers, stringIndices, mainContentGridRow, fretLabelsGridRow } =
    geometry;

  return (
    <div className={styles.subgridOverlay}>
      <div
        data-id="fretboard-fingerboard-area"
        className={styles.fingerboardArea}
        style={
          {
            "--fretboard-row": mainContentGridRow,
            "--fretboard-bg": geometry.background,
          } as CSSProperties
        }
      >
        {fretNumbers.map((fretNumber: number) => (
          <Fret key={fretNumber} fretNumber={fretNumber} />
        ))}
      </div>

      <div
        data-id="fretboard-strings-area"
        className={styles.stringsArea}
        style={
          {
            "--strings-row": mainContentGridRow,
          } as CSSProperties
        }
      >
        {stringIndices.map((stringIndex: number) => (
          <InstrumentString key={stringIndex} stringIndex={stringIndex} />
        ))}
      </div>

      {geometry.showFretLabels ? (
        <div
          data-id="fretboard-fret-labels-area"
          className={styles.labelsArea}
          style={
            {
              "--labels-row": fretLabelsGridRow,
              "--labels-height": geometry.fretLabelsHeight,
              "--labels-bg": geometry.fretLabelsBackground,
            } as CSSProperties
          }
        >
          {fretNumbers.map((fretNumber: number) => (
            <FretLabel key={fretNumber} fretNumber={fretNumber} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
