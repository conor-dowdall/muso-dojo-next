import type { ActiveNote } from "@/types/fretboard/fretboard";

interface FretboardNoteProps {
  note: ActiveNote;
  label?: string;
  onPointerDown?: () => void;
  style?: React.CSSProperties;
}

export default function FretboardNote({
  note,
  label,
  onPointerDown,
  style,
}: FretboardNoteProps) {
  const isLarge = note.emphasis === "large";

  // A typical character width-to-height ratio is about 0.6 in standard fonts.
  // We use this to estimate the horizontal space the string will take.
  const charCount = Math.max(1, label?.length || 1);
  const maxFontWidth = 100 / (charCount * 0.7);

  return (
    <div
      style={{
        ...style,
        containerType: "size",
        backgroundColor: "black",
        color: "white",
        textBoxTrim: "trim-both",
        textBoxEdge: "cap alphabetic",
        pointerEvents: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "bold",
        transition: "all 0.2s cubic-bezier(0.5, -1, 1, 1)",
        width: isLarge ? "90%" : "60%",
        height: isLarge ? "90%" : "60%",
        opacity: isLarge ? 1 : 0.8,
        borderRadius: "12%",
        overflow: "hidden",
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onPointerDown?.();
      }}
    >
      <span
        style={{
          // Use 'min' to constrain the text by BOTH height and width limits.
          // 80cqh: Caps the height to 80% of the container (leaves nice padding).
          // maxFontWidth * cqw: Caps by width based on string length!
          fontSize: `min(80cqh, ${maxFontWidth}cqw)`,
        }}
      >
        {label}
      </span>
    </div>
  );
}
