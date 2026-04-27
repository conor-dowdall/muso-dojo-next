import { type CSSProperties } from "react";
import { fretboardIcons } from "@/components/fretboard/icons";
import { useFretboardGeometry } from "./FretboardContext";
import styles from "./Fretboard.module.css";

export function FretLabel({ fretNumber }: { fretNumber: number }) {
  const geometry = useFretboardGeometry();
  const isMarker = geometry.isMarker(fretNumber);

  const fretLabelMode = geometry.fretLabelMode;
  const isImageMode = fretLabelMode === "image";

  const shape =
    isImageMode && isMarker
      ? (geometry.fretLabelImages?.[fretNumber] ?? geometry.fretLabelImage)
      : undefined;

  const Icon = shape !== undefined ? fretboardIcons[shape] : null;

  const height = geometry.fretLabelsHeight;
  const color = geometry.fretLabelColor;

  const isDouble = geometry.isDoubleLabel(fretNumber);

  const isNut = fretNumber === 0;
  const wireWidth = isNut ? geometry.nutWidth : geometry.fretWireWidth;

  function renderIconContent() {
    if (!Icon) return null;
    const iconEl = (
      <Icon
        strokeWidth={0}
        className={styles.labelIcon}
        style={
          {
            "--label-icon-size": `calc(${height} * 0.65)`,
            "--label-color": color,
          } as CSSProperties
        }
      />
    );
    return isDouble ? (
      <>
        {iconEl}
        {iconEl}
      </>
    ) : (
      iconEl
    );
  }

  return (
    <div
      className={styles.fretLabel}
      style={
        {
          "--wire-width": wireWidth,
        } as CSSProperties
      }
    >
      <div
        className={styles.labelContent}
        style={
          {
            "--label-gap": geometry.fretLabelDoubleGap,
          } as CSSProperties
        }
      >
        {isMarker ? (
          isImageMode ? (
            renderIconContent()
          ) : (
            <span
              className={styles.labelText}
              style={
                {
                  "--label-font-size": `calc(${height} * 0.8)`,
                  "--label-color": color,
                } as CSSProperties
              }
            >
              {fretNumber}
            </span>
          )
        ) : null}
      </div>
    </div>
  );
}
