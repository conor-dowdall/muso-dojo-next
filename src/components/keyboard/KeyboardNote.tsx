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
  const isLarge = note.emphasis === "large";

  return (
    <div
      data-component="KeyboardNote"
      style={{
        pointerEvents: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: isLarge ? "80%" : "55%",
        aspectRatio: "1",
        borderRadius: "50%",
        backgroundColor: isBlack
          ? "rgba(255, 255, 255, 0.9)"
          : "rgba(0, 0, 0, 0.85)",
        color: isBlack ? "#1a1a1a" : "#ffffff",
        fontWeight: "bold",
        transition: "all 0.15s ease-out",
        opacity: isLarge ? 1 : 0.6,
        fontSize: "clamp(0.4rem, 1.5cqw, 0.75rem)",
        overflow: "hidden",
      }}
    >
      {label && <span>{label}</span>}
    </div>
  );
}
