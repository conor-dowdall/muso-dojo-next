import styles from "./DisplayFormatPicker.module.css";
import { OptionButton } from "@/components/ui/buttons/OptionButton";
import {
  displayFormatOptions,
  type DisplayFormatId,
} from "@/data/displayFormats";

interface DisplayFormatPickerProps {
  onSelect: () => void;
  activeDisplayFormatId: DisplayFormatId;
  onDisplayFormatChange: (id: DisplayFormatId) => void;
}

export function DisplayFormatPicker({
  onSelect,
  activeDisplayFormatId,
  onDisplayFormatChange,
}: DisplayFormatPickerProps) {
  return (
    <div className={styles.buttonGrid}>
      {displayFormatOptions.map((displayFormat) => (
        <OptionButton
          key={displayFormat.id}
          density="compact"
          label={displayFormat.shortLabel}
          presentation="tile"
          selected={activeDisplayFormatId === displayFormat.id}
          subtitle={displayFormat.example}
          onClick={() => {
            onDisplayFormatChange(displayFormat.id);
            onSelect();
          }}
        />
      ))}
    </div>
  );
}
