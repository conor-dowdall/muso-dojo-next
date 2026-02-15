import { useFretboardConfig } from "@/context/FretboardContext";

export default function InstrumentString({
  stringNumber,
}: {
  stringNumber: number;
}) {
  const config = useFretboardConfig();
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
