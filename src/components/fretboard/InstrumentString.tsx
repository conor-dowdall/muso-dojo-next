import { type CSSProperties } from "react";
import { useFretboardGeometry } from "./FretboardContext";
import styles from "./Fretboard.module.css";

export function InstrumentString({ stringIndex }: { stringIndex: number }) {
  const geometry = useFretboardGeometry();
  const show = geometry.showStrings;
  const width = geometry.stringWidths?.[stringIndex] ?? geometry.stringWidth;
  const color = geometry.stringColors?.[stringIndex] ?? geometry.stringColor;
  const shadow = geometry.stringShadow;
  const texture =
    geometry.stringTextures?.[stringIndex] ?? geometry.stringTexture;

  return (
    <div className={styles.stringArea}>
      {show ? (
        <div
          className={styles.string}
          data-string-texture={texture}
          style={
            {
              "--string-width": width,
              "--string-color": color,
              "--string-shadow": shadow,
            } as CSSProperties
          }
        />
      ) : null}
    </div>
  );
}
