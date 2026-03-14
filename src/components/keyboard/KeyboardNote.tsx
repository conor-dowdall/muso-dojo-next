import type { ActiveNote } from "@/types/instrument/shared";

interface KeyboardNoteProps {
  note: ActiveNote;
  label?: string;
  isBlack: boolean;
}

export default function KeyboardNote({
  note,
  label,
  isBlack,
}: KeyboardNoteProps) {
  const emphasis = note.emphasis;
  const isLarge = emphasis === "large";
  const isHidden = emphasis === "hidden";

  return (
    <div
      data-component="KeyboardNote"
      style={{
        pointerEvents: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: isHidden ? "0%" : isLarge ? "80%" : "55%",
        opacity: isHidden ? 0 : isLarge ? 1 : 0.6,
        transform: isHidden ? "scale(0)" : "scale(1)",
        aspectRatio: "1",
        borderRadius: "12%",
        backgroundColor: isBlack ? "white" : "black",
        color: isBlack ? "black" : "white",
        fontWeight: "bold",
        transition: "all 0.15s ease-out",
        fontSize: "clamp(0.4rem, 1.5cqw, 0.75rem)",
        overflow: "hidden",
        textBoxTrim: "trim-both",
        textBoxEdge: "cap alphabetic",
      }}
    >
      {label && <span>{label}</span>}
    </div>
  );
}
