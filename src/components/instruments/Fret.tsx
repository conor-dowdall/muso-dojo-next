import { FretProps } from "@/types/fretboard";

export default function Fret({ fretNumber, theme }: FretProps) {
  return (
    <div className="relative h-full" data-fret-number={fretNumber}>
      {/* Fret wire */}
      <div
        className="absolute top-0 right-0 h-full"
        style={{
          width: theme.fretWireWidth,
          backgroundColor: theme.fretWireColor,
        }}
      />
    </div>
  );
}
