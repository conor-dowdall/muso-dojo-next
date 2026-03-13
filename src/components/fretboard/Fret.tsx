import { fretboardIcons } from "@/configs/fretboard/icons";
import { useFretboardConfig } from "@/context/fretboard/FretboardContext";
import styles from "./Fretboard.module.css";

export default function Fret({ fretNumber }: { fretNumber: number }) {
  const config = useFretboardConfig();
  const isNut = fretNumber === 0;
  const show = isNut ? config.showNut : config.showFretWires;
  const width = isNut ? config.nutWidth : config.fretWireWidth;
  const color = isNut ? config.nutColor : config.fretWireColor;

  const markerFrets = config.markerFrets;
  const isMarker = markerFrets.includes(fretNumber);
  const showFretInlays = config.showFretInlays;

  const shape =
    !isNut && showFretInlays && isMarker
      ? (config.fretInlayImages?.[fretNumber] ?? config.fretInlayImage)
      : undefined;

  const Icon = shape ? fretboardIcons[shape] : null;

  const inlayWidth = config.fretInlayWidth;
  const inlayHeight = config.fretInlayHeight;
  const inlayColor = config.fretInlayColor;

  const fretInlayDoubles = config.fretInlayDoubles;
  const isDouble = fretInlayDoubles && fretInlayDoubles.includes(fretNumber);

  const leftHanded = config.leftHanded;

  return (
    <div
      data-component="Fret"
      className={styles.fret}
      style={
        {
          "--inlay-gap": config.fretInlayDoubleGap,
        } as React.CSSProperties
      }
    >
      <div
        className={styles.fretContent}
        style={
          {
            flexDirection: isDouble ? "column" : "row",
          } as React.CSSProperties
        }
      >
        {Icon && (
          <>
            <div
              className={styles.inlayIconWrapper}
              style={
                {
                  "--inlay-width": inlayWidth,
                  "--inlay-height": inlayHeight,
                } as React.CSSProperties
              }
            >
              <Icon
                fill={inlayColor}
                strokeWidth={0}
                preserveAspectRatio="none"
                style={{
                  width: "100%",
                  height: "100%",
                  transform: leftHanded ? "scaleX(-1)" : undefined,
                }}
              />
            </div>
            {isDouble && (
              <div
                className={styles.inlayIconWrapper}
                style={
                  {
                    "--inlay-width": inlayWidth,
                    "--inlay-height": inlayHeight,
                  } as React.CSSProperties
                }
              >
                <Icon
                  fill={inlayColor}
                  strokeWidth={0}
                  preserveAspectRatio="none"
                  style={{
                    width: "100%",
                    height: "100%",
                    transform: leftHanded ? "scaleX(-1)" : undefined,
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
      {show && (
        <div
          className={styles.fretWire}
          style={
            {
              "--wire-width": width,
              "--wire-color": color,
            } as React.CSSProperties
          }
        />
      )}
    </div>
  );
}
