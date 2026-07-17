import { type ReactNode } from "react";
import { Button } from "@/components/ui/buttons/Button";
import styles from "./ChoiceModeControl.module.css";

interface ChoiceModeOption<T extends string> {
  ariaLabel: string;
  label: ReactNode;
  value: T;
}

interface ChoiceModeControlProps<T extends string> {
  ariaLabel: string;
  options: readonly ChoiceModeOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function ChoiceModeControl<T extends string>({
  ariaLabel,
  options,
  value,
  onChange,
}: ChoiceModeControlProps<T>) {
  return (
    <span className={styles.controls} role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <Button
          key={option.value}
          aria-label={option.ariaLabel}
          density="compact"
          label={option.label}
          selected={value === option.value}
          size="sm"
          onClick={() => onChange(option.value)}
        />
      ))}
    </span>
  );
}
