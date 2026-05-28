import { type ReactNode } from "react";
import { Circle, CircleDot, CircleOff } from "lucide-react";
import { OptionButton } from "@/components/ui/buttons/OptionButton";
import { type InstrumentNoteEmphasis } from "@/types/instrument-note-emphasis";
import styles from "./InstrumentNoteEmphasisPicker.module.css";

const noteEmphasisOptions = [
  {
    id: "large",
    label: "Large",
    icon: <Circle />,
  },
  {
    id: "small",
    label: "Small",
    icon: <CircleDot />,
  },
  {
    id: "hidden",
    label: "Hidden",
    icon: <CircleOff />,
  },
] as const satisfies readonly {
  icon: ReactNode;
  id: InstrumentNoteEmphasis;
  label: string;
}[];

const noteEmphasisLabels = Object.fromEntries(
  noteEmphasisOptions.map((option) => [option.id, option.label]),
) as Record<InstrumentNoteEmphasis, string>;

export function getInstrumentNoteEmphasisLabel(
  noteEmphasis: InstrumentNoteEmphasis,
) {
  return noteEmphasisLabels[noteEmphasis];
}

export function InstrumentNoteEmphasisPicker({
  value,
  onChange,
}: {
  value?: InstrumentNoteEmphasis;
  onChange: (noteEmphasis: InstrumentNoteEmphasis) => void;
}) {
  return (
    <div className={styles.noteEmphasisGrid}>
      {noteEmphasisOptions.map((option) => (
        <OptionButton
          key={option.id}
          density="compact"
          icon={option.icon}
          label={option.label}
          presentation="tile"
          selected={value === option.id}
          onClick={() => onChange(option.id)}
        />
      ))}
    </div>
  );
}
