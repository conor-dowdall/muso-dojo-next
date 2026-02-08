import { FretProps } from "@/types/fretboard";
import { fretboardDefaults } from "@/configs/fretboard/defaults";
import { fretboardIcons } from "@/configs/fretboard/icons";

export default function Fret({ fretNumber, config }: FretProps) {
  const isNut = fretNumber === 0;
  const show = isNut
    ? (config.showNut ?? fretboardDefaults.showNut)
    : (config.showFretWires ?? fretboardDefaults.showFretWires);
  const width = isNut
    ? (config.nutWidth ?? fretboardDefaults.nutWidth)
    : (config.fretWireWidth ?? fretboardDefaults.fretWireWidth);
  const color = isNut
    ? (config.nutColor ?? fretboardDefaults.nutColor)
    : (config.fretWireColor ?? fretboardDefaults.fretWireColor);

  const markerFrets = config.markerFrets ?? fretboardDefaults.markerFrets;
  const isMarker = markerFrets.includes(fretNumber);
  const showFretInlays =
    config.showFretInlays ?? fretboardDefaults.showFretInlays;

  const shape =
    !isNut && showFretInlays && isMarker
      ? (config.fretInlayImages?.[fretNumber] ??
        config.fretInlayImage ??
        fretboardDefaults.fretInlayImages?.[fretNumber] ??
        fretboardDefaults.fretInlayImage)
      : undefined;

  const Icon = shape ? fretboardIcons[shape] : null;

  const inlayWidth = config.fretInlayWidth ?? fretboardDefaults.fretInlayWidth;
  const inlayHeight =
    config.fretInlayHeight ?? fretboardDefaults.fretInlayHeight;
  const inlayColor = config.fretInlayColor ?? fretboardDefaults.fretInlayColor;

  const fretInlayDoubles =
    config.fretInlayDoubles ?? fretboardDefaults.fretInlayDoubles;
  const isDouble = fretInlayDoubles && fretInlayDoubles.includes(fretNumber);

  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        display: "flex",
        flexDirection: "row",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: isDouble ? "column" : "row", // Vertical for double, center for single
          alignItems: "center",
          justifyContent: "center",
          gap:
            config.fretInlayDoubleGap ?? fretboardDefaults.fretInlayDoubleGap,
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
