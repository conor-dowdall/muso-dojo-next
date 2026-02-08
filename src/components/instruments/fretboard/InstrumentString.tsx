import { InstrumentStringProps } from "@/types/fretboard";
import { fretboardDefaults } from "@/configs/fretboard/defaults";

export default function InstrumentString({
  stringNumber,
  config,
}: InstrumentStringProps) {
  const show = config.showStrings ?? fretboardDefaults.showStrings;
  const width =
    config.stringWidths?.[stringNumber] ??
    config.stringWidth ??
    fretboardDefaults.stringWidths?.[stringNumber] ??
    fretboardDefaults.stringWidth;
  const color =
    config.stringColors?.[stringNumber] ??
    config.stringColor ??
    fretboardDefaults.stringColors?.[stringNumber] ??
    fretboardDefaults.stringColor;

  return (
    <div
      style={{
        flex: "1",
        display: "flex",
        alignItems: "center",
        width: "100%",
        position: "relative",
      }}
    >
      {show && (
        <div
          style={{
            width: "100%",
            height: width,
            background: color,
          }}
        />
      )}
    </div>
  );
}
