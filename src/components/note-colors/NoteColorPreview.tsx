import {
  NOTE_COLOR_INDEXES,
  NOTE_COLOR_NEUTRAL_VALUE,
} from "@/data/noteColors";
import { type NoteColorTuple } from "@/types/note-colors";
import styles from "./NoteColorPreview.module.css";

interface NoteColorPreviewProps {
  colors: NoteColorTuple<string | null>;
}

function getPreviewColorValue(color: string | null) {
  return color ?? NOTE_COLOR_NEUTRAL_VALUE;
}

export function NoteColorPreview({ colors }: NoteColorPreviewProps) {
  return (
    <span className={styles.preview} aria-hidden="true">
      {NOTE_COLOR_INDEXES.map((index) => {
        const color = colors[index];

        return (
          <span
            key={index}
            className={styles.dot}
            style={{ backgroundColor: getPreviewColorValue(color) }}
          />
        );
      })}
    </span>
  );
}
