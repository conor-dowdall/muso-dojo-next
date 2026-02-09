import { FretProps } from "@/types/fretboard";
import { fretboardIcons } from "@/configs/fretboard/icons";

export default function Fret({ fretNumber, config }: FretProps) {
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

  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        display: "flex",
        flexDirection: "row",
        overflow: "hidden", // Prevent large icons from expanding the fret
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: isDouble ? "column" : "row", // Vertical for double, center for single
          alignItems: "center",
          justifyContent: "center",
          gap: config.fretInlayDoubleGap,

          overflow: "hidden", // Ensure content doesn't spill out
        }}
      >
        {Icon &&
          (isDouble ? (
            <>
              <div
                style={{
                  width: inlayWidth,
                  height: inlayHeight,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  maxWidth: "100%",
                  maxHeight: "100%",
                }}
              >
                <Icon
                  fill={inlayColor}
                  strokeWidth={0}
                  preserveAspectRatio="none"
                  style={{
                    width: "100%",
                    height: "100%",
                    maxWidth: "100%",
                    maxHeight: "100%",
                  }}
                />
              </div>
              <div
                style={{
                  width: inlayWidth,
                  height: inlayHeight,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  maxWidth: "100%",
                  maxHeight: "100%",
                }}
              >
                <Icon
                  fill={inlayColor}
                  strokeWidth={0}
                  preserveAspectRatio="none"
                  style={{
                    width: "100%",
                    height: "100%",
                    maxWidth: "100%",
                    maxHeight: "100%",
                  }}
                />
              </div>
            </>
          ) : (
            <div
              style={{
                width: inlayWidth,
                height: inlayHeight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                maxWidth: "100%",
                maxHeight: "100%",
              }}
            >
              <Icon
                fill={inlayColor}
                strokeWidth={0}
                preserveAspectRatio="none"
                style={{
                  width: "100%",
                  height: "100%",
                  maxWidth: "100%",
                  maxHeight: "100%",
                }}
              />
            </div>
          ))}
      </div>
      {show && (
        <div
          style={{
            height: "100%",
            width: width,
            background: color,
            flexShrink: 0,
          }}
        />
      )}
    </div>
  );
}
