import { FretProps } from "@/types/fretboard";

export default function Fret({ fretNumber, config }: FretProps) {
  const isNut = fretNumber === 0;
  const show = isNut ? config.showNut : config.showFretWires;
  const width = isNut ? config.nutWidth : config.fretWireWidth;
  const color = isNut ? config.nutColor : config.fretWireColor;

  return (
    <div className="relative h-full " data-fret-number={fretNumber}>
      {show && (
        <div
          className="absolute top-0 right-0 h-full "
          style={{
            width: width,
            background: color,
          }}
        />
      )}
    </div>
  );
}
