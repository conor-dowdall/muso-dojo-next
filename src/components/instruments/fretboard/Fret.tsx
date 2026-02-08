import { FretProps } from "@/types/fretboard";

export default function Fret({ fretNumber, config }: FretProps) {
  const isNut = fretNumber === 0;
  const show = isNut ? config.showNut : config.showFretWires;
  const width = isNut ? config.nutWidth : config.fretWireWidth;
  const color = isNut ? config.nutColor : config.fretWireColor;

  return (
    <div
      style={{ position: "relative", height: "100%" }}
      data-fret-number={fretNumber}
    >
      {show && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            height: "100%",
            width: width,
            background: color,
          }}
        />
      )}
    </div>
  );
}
