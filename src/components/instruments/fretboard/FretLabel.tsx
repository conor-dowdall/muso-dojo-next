import { type FretProps } from "@/types/fretboard";
import { fretboardIcons } from "@/configs/fretboard/icons";

export default function FretLabel({ fretNumber, config }: FretProps) {
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
  const color = config.fretLabelsColor;

  const fretLabelDoubles = config.fretLabelDoubles;
  const isDouble = fretLabelDoubles && fretLabelDoubles.includes(fretNumber);

  // Calculate the wire/nut width to compensate for centering
  const isNut = fretNumber === 0;
  const wireWidth = isNut ? config.nutWidth : config.fretWireWidth;

  // We need to match the layout of Fret.tsx for alignment.
  // Fret.tsx has [Content (flex: 1)] [Wire (width: wireWidth)]
  // Therefore, FretLabel should also reserve space on the right equal to wireWidth.
  // Even if the wire isn't visually part of the label, the label should center relative to the fret space *minus* the wire.

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        height: "100%",
        width: "100%",
        overflow: "visible",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          overflow: "visible",
          gap: config.fretLabelDoubleGap,
        }}
      >
        {isMarker &&
          (isImageMode ? (
            Icon &&
            (isDouble ? (
              <>
                <Icon
                  fill={color}
                  strokeWidth={0}
                  style={{
                    height: `calc(${height} * 0.65)`,
                    width: "auto",
                    maxWidth: "100%",
                  }}
                />
                <Icon
                  fill={color}
                  strokeWidth={0}
                  style={{
                    height: `calc(${height} * 0.65)`,
                    width: "auto",
                    maxWidth: "100%",
                  }}
                />
              </>
            ) : (
              <Icon
                fill={color}
                strokeWidth={0}
                style={{
                  height: `calc(${height} * 0.65)`,
                  width: "auto",
                  maxWidth: "100%",
                }}
              />
            ))
          ) : (
            <span
              style={{
                fontSize: `calc(${height} * 0.8)`,
                textBoxTrim: "trim-both",
                textBoxEdge: "cap alphabetic",
                color: color,
              }}
            >
              {fretNumber}
            </span>
          ))}
      </div>
      {/* Spacer to simulate the wire width for alignment */}
      <div style={{ width: wireWidth, flexShrink: 0 }} />
    </div>
  );
}
