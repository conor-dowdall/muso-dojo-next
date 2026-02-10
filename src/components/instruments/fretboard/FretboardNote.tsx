import { ActiveNote } from "@/types/fretboard";

interface FretboardNoteProps {
  note: ActiveNote;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export default function FretboardNote({
  note,
  onClick,
  style,
}: FretboardNoteProps) {
  const isLarge = note.emphasis === "large";

  return (
    <div
      style={{
        ...style,
        position: "absolute",
        inset: 0,
        margin: "auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "bold",
        userSelect: "none",
        cursor: "pointer",
        borderRadius: "9999px", // full rounded
        transition: "all 0.2s ease-in-out",
        width: isLarge ? "80%" : "50%",
        height: isLarge ? "80%" : "50%",
        fontSize: isLarge ? "0.875rem" : "0.75rem",
        zIndex: isLarge ? 10 : 0,
        opacity: isLarge ? 1 : 0.8,
        // Using generic colors for now, can be replaced with theme vars or config
        backgroundColor: "var(--primary, #000)",
        color: "var(--primary-foreground, #fff)",
        boxShadow: isLarge ? "0 4px 6px -1px rgba(0, 0, 0, 0.1)" : "none",
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      {note.midi}
    </div>
  );
}
