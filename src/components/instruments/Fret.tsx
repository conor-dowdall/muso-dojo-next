import { FretProps } from "@/types/fretboard";

export default function Fret({ fretNumber, config }: FretProps) {
  return (
    <div className="relative h-full" data-fret-number={fretNumber}>
      <div
        className="absolute top-0 right-0 h-full"
        style={{
          width: config.fretWireWidth,
          background: config.fretWireColor,
        }}
      />
    </div>
  );
}
