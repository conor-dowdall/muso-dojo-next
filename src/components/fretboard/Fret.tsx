import { type CSSProperties } from "react";
import { fretboardIcons } from "@/components/fretboard/icons";
import { useFretboardGeometry } from "./FretboardContext";
import styles from "./Fretboard.module.css";

export function Fret({ fretNumber }: { fretNumber: number }) {
  const geometry = useFretboardGeometry();
  const isNut = fretNumber === 0;
  const show = isNut ? geometry.showNut : geometry.showFretWires;
  const width = isNut ? geometry.nutWidth : geometry.fretWireWidth;
  const color = isNut ? geometry.nutColor : geometry.fretWireColor;
  const shadow = isNut ? geometry.nutShadow : geometry.fretWireShadow;

  const isMarker = geometry.isMarker(fretNumber);
  const showFretInlays = geometry.showFretInlays;

  const shape =
    !isNut && showFretInlays && isMarker
      ? (geometry.fretInlayImages?.[fretNumber] ?? geometry.fretInlayImage)
      : undefined;

  const Icon = shape !== undefined ? fretboardIcons[shape] : null;

  const inlayWidth = geometry.fretInlayWidth;
  const inlayHeight = geometry.fretInlayHeight;
  const inlayColor = geometry.fretInlayColor;

  const isDouble = geometry.isDoubleInlay(fretNumber);

  const leftHanded = geometry.leftHanded;

  const renderInlay = () => {
    if (!Icon) return null;
    return (
      <div
        className={styles.inlayIconWrapper}
        style={
          {
            "--inlay-width": inlayWidth,
            "--inlay-height": inlayHeight,
            "--inlay-transform": leftHanded ? "scaleX(-1)" : undefined,
          } as CSSProperties
        }
      >
        <Icon
          fill={inlayColor}
          strokeWidth={0}
          preserveAspectRatio="none"
          className={styles.inlayIcon}
        />
      </div>
    );
  };

  return (
    <div className={styles.fret}>
      <div className={styles.fretContent}>
        <div
          className={styles.inlayGroup}
          style={
            {
              "--fret-content-direction": isDouble ? "column" : "row",
              "--inlay-gap": geometry.fretInlayDoubleGap,
            } as CSSProperties
          }
        >
          {renderInlay()}
          {isDouble ? renderInlay() : null}
        </div>
      </div>
      {show ? (
        <div
          className={styles.fretWire}
          data-fret-part={isNut ? "nut" : "wire"}
          style={
            {
              "--wire-width": width,
              "--wire-color": color,
              "--wire-shadow": shadow,
            } as CSSProperties
          }
        />
      ) : null}
    </div>
  );
}
