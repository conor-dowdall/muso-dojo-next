import { fretboardIcons } from "@/configs/fretboard/icons";
import { useFretboardConfig } from "@/context/fretboard/FretboardContext";
import styles from "./Fretboard.module.css";

export default function FretLabel({ fretNumber }: { fretNumber: number }) {
  const config = useFretboardConfig();
  const markerFrets = config.markerFrets;
  const isMarker = markerFrets.includes(fretNumber);

  const fretLabelMode = config.fretLabelMode;
  const isImageMode = fretLabelMode === "image";

  const shape =
    isImageMode && isMarker
      ? (config.fretLabelImages?.[fretNumber] ?? config.fretLabelImage)
      : undefined;

  const Icon =
    shape && shape in fretboardIcons
      ? fretboardIcons[shape as keyof typeof fretboardIcons]
      : null;

  const height = config.fretLabelsHeight;
  const color = config.fretLabelColor;

  const fretLabelDoubles = config.fretLabelDoubles;
  const isDouble = fretLabelDoubles && fretLabelDoubles.includes(fretNumber);

  // Calculate the wire/nut width to compensate for centering
  const isNut = fretNumber === 0;
  const wireWidth = isNut ? config.nutWidth : config.fretWireWidth;

  return (
    <div
      data-component="FretLabel"
      className={styles.fretLabel}
      style={
        {
          "--wire-width": wireWidth,
        } as React.CSSProperties
      }
    >
      <div
        className={styles.labelContent}
        style={
          {
            "--label-gap": config.fretLabelDoubleGap,
          } as React.CSSProperties
        }
      >
        {isMarker &&
          (isImageMode ? (
            Icon &&
            (isDouble ? (
              <>
                <Icon
                  fill={color}
                  strokeWidth={0}
                  className={styles.labelIcon}
                  style={
                    {
                      "--label-icon-size": `calc(${height} * 0.65)`,
                    } as React.CSSProperties
                  }
                />
                <Icon
                  fill={color}
                  strokeWidth={0}
                  className={styles.labelIcon}
                  style={
                    {
                      "--label-icon-size": `calc(${height} * 0.65)`,
                    } as React.CSSProperties
                  }
                />
              </>
            ) : (
              <Icon
                fill={color}
                strokeWidth={0}
                className={styles.labelIcon}
                style={
                  {
                    "--label-icon-size": `calc(${height} * 0.65)`,
                  } as React.CSSProperties
                }
              />
            ))
          ) : (
            <span
              className={styles.labelText}
              style={
                {
                  "--label-font-size": `calc(${height} * 0.8)`,
                  "--label-color": color,
                } as React.CSSProperties
              }
            >
              {fretNumber}
            </span>
          ))}
      </div>
      {/* Spacer to simulate the wire width for alignment */}
      <div className={styles.labelSpacer} />
    </div>
  );
}
