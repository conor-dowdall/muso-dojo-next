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

  // A typical character width-to-height ratio is about 0.6 in standard fonts.
  // We use this to estimate the horizontal space the string will take.
  const charCount = Math.max(1, label?.length || 1);
  const maxFontWidth = 100 / (charCount * 0.7);

  return (
    <div
      data-component="KeyboardNote"
      style={{
        container: "keyboard-note / size",
        pointerEvents: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: isHidden ? "0%" : isLarge ? "80%" : "55%",
        opacity: isHidden ? 0 : isLarge ? 1 : 0.6,
        transform: isHidden ? "scale(0)" : "scale(1)",
        aspectRatio: "1",
        borderRadius: "12%",
        marginBlockEnd: "0.3rem",
        backgroundColor: isBlack ? "white" : "black",
        color: isBlack ? "black" : "white",
        fontWeight: "bold",
        transition: "all 0.15s ease-out",
        overflow: "hidden",
        textBoxTrim: "trim-both",
        textBoxEdge: "cap alphabetic",
      }}
    >
      <span
        style={{
          fontSize: `min(80cqh, ${maxFontWidth}cqw)`,
        }}
      >
        {label}
      </span>
    </div>
  );
}
