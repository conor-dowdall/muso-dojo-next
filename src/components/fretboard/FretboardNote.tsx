import type { ActiveNote } from "@/types/fretboard/fretboard";
import styles from "./Fretboard.module.css";

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
      data-component="FretboardNote"
      className={styles.note}
      style={{
        ...style,
        width: isLarge ? "90%" : "60%",
        height: isLarge ? "90%" : "60%",
        opacity: isLarge ? 1 : 0.8,
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onPointerDown?.();
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
