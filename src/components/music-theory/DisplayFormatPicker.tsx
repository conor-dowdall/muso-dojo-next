"use client";

import styles from "./DisplayFormatPicker.module.css";
import { OptionButton } from "@/components/ui/buttons/OptionButton";
import {
  displayFormatOptions,
  type DisplayFormatId,
} from "@/data/displayFormats";

interface DisplayFormatPickerProps {
  value: DisplayFormatId;
  onChange: (id: DisplayFormatId) => void;
}

export function DisplayFormatPicker({
  value,
  onChange,
}: DisplayFormatPickerProps) {
  return (
    <div className={styles.buttonGrid}>
      {displayFormatOptions.map((displayFormat) => (
        <OptionButton
          key={displayFormat.id}
          density="compact"
          label={displayFormat.shortLabel}
          presentation="tile"
          selected={value === displayFormat.id}
          subtitle={displayFormat.example}
          onClick={() => onChange(displayFormat.id)}
        />
      ))}
    </div>
  );
}
