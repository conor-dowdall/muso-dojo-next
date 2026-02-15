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

  return (
    <div
      style={{
        ...style,
        backgroundColor: "black",
        color: "white",
        textBoxTrim: "trim-both",
        textBoxEdge: "cap alphabetic",
        pointerEvents: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "bold",
        transition: "all 0.2s ease-in-out",
        width: isLarge ? "80%" : "50%",
        height: isLarge ? "80%" : "50%",
        fontSize: isLarge ? "0.875rem" : "0.75rem",
        opacity: isLarge ? 1 : 0.8,
        borderRadius: isLarge ? "1cqi" : "0.8cqi",
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onPointerDown?.();
      }}
    >
      {label}
    </div>
  );
}
