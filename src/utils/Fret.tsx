import type { FretProps } from "@/types/fretboard";

export default function Fret({ fretNumber, config }: FretProps) {
  const isNut = fretNumber === 0;
  const showWire = isNut ? config.showNut : config.showFretWires;

  const wireWidth = isNut ? config.nutWidth : config.fretWireWidth;
  const wireColor = isNut ? config.nutColor : config.fretWireColor;

  return (
    <div className="fret">
      {showWire && <div className="wire" />}

      <style jsx>{`
        .fret {
          position: relative;
          width: 100%;
          height: 100%;
        }
        .wire {
          position: absolute;
          top: 0;
          bottom: 0;
          right: 0;
          width: ${wireWidth};
          background: ${wireColor};
          transform: translateX(50%);
          z-index: 10;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
