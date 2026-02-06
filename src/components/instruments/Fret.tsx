import { FretProps } from "@/types/fretboard";

export default function Fret({ fretNumber }: FretProps) {
  return (
    <div className="relative h-full" data-fret-number={fretNumber}>
      {/* Fret wire */}
      <div className="absolute top-0 right-0 h-full w-0.5 bg-gray-400" />
    </div>
  );
}
