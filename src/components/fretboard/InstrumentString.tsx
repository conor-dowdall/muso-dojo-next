import { useFretboardConfig } from "@/context/fretboard/FretboardContext";
import styles from "./Fretboard.module.css";

export default function InstrumentString({
  stringNumber,
}: {
  stringNumber: number;
}) {
  const config = useFretboardConfig();
  const show = config.showStrings;
  const width = config.stringWidths?.[stringNumber] ?? config.stringWidth;
  const color = config.stringColors?.[stringNumber] ?? config.stringColor;

  return (
    <div data-component="InstrumentString" className={styles.instrumentStringArea}>
      {show && (
        <div
          className={styles.instrumentStringWire}
          style={
            {
              "--string-width": width,
              "--string-color": color,
            } as React.CSSProperties
          }
        />
      )}
    </div>
  );
}
