import type { ActiveNote } from "@/types/fretboard/fretboard";
import styles from "./Fretboard.module.css";

interface FretboardNoteProps {
  note: ActiveNote;
  label?: string;
  style?: React.CSSProperties;
}

export default function FretboardNote({
  note,
  label,
  style,
}: FretboardNoteProps) {
  const emphasis = note.emphasis;
  const isLarge = emphasis === "large";
  const isHidden = emphasis === "hidden";

  // A typical character width-to-height ratio is about 0.6 in standard fonts.
  // We use this to estimate the horizontal space the string will take.
  const charCount = Math.max(1, label?.length || 1);
  const maxFontWidth = 100 / (charCount * 0.7);

  return (
    <div
      data-component="FretboardNote"
      className={styles.note}
      style={{
        ...style,
        width: isHidden ? "0%" : isLarge ? "90%" : "60%",
        height: isHidden ? "0%" : isLarge ? "90%" : "60%",
        opacity: isHidden ? 0 : isLarge ? 1 : 0.8,
        transform: isHidden ? "scale(0)" : "scale(1)",
        pointerEvents: "none",
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
