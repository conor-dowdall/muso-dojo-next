import { FretProps } from "@/types/fretboard";
import { Circle, Square, Star, Triangle } from "lucide-react";

const icons = {
  circle: Circle,
  square: Square,
  star: Star,
  triangle: Triangle,
};

export default function FretLabel({ fretNumber, config }: FretProps) {
  const isMarker = config.markerFrets.includes(fretNumber);
  const isImageMode = config.fretLabelMode === "image";
  const shape =
    isImageMode && isMarker
      ? (config.fretLabelImages?.[fretNumber] ?? config.fretLabelImage)
      : undefined;
  const Icon = shape ? icons[shape] : null;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "visible",
      }}
    >
      {isMarker &&
        (isImageMode ? (
          Icon && (
            <Icon
              fill="black"
              strokeWidth={0}
              style={{
                height: `calc(${config.fretLabelsHeight} * 0.65)`,
                width: "auto",
                maxWidth: "100%",
              }}
            />
          )
        ) : (
          <span
            style={{
              fontSize: `calc(${config.fretLabelsHeight} * 0.8)`,
              textBoxTrim: "trim-both",
              textBoxEdge: "cap alphabetic",
              color: config.fretLabelsColor,
            }}
          >
            {fretNumber}
          </span>
        ))}
    </div>
  );
}
