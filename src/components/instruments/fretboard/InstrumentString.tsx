import { InstrumentStringProps } from "@/types/fretboard";

export default function InstrumentString({
  stringNumber,
  config,
}: InstrumentStringProps) {
  const show = config.showStrings;
  const width = config.stringWidths?.[stringNumber] ?? config.stringWidth;
  const color = config.stringColors?.[stringNumber] ?? config.stringColor;

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
