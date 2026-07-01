"use client";

import { Minus, Plus } from "lucide-react";
import { IconButton } from "@/components/ui/buttons/IconButton";
import fieldStyles from "@/components/ui/control-field/ControlField.module.css";
import styles from "./NumericStepper.module.css";

function clampValue(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function NumericStepper({
  "aria-label": ariaLabel,
  canDecrease,
  canIncrease,
  disabled = false,
  formatValue,
  max,
  min,
  onChange,
  value,
}: {
  "aria-label": string;
  canDecrease?: boolean;
  canIncrease?: boolean;
  disabled?: boolean;
  formatValue: (value: number) => string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  value: number;
}) {
  const decreaseDisabled = disabled || value <= min || canDecrease === false;
  const increaseDisabled = disabled || value >= max || canIncrease === false;
  const valueLabel = formatValue(value);

  return (
    <div aria-label={ariaLabel} className={styles.stepper} role="group">
      <IconButton
        aria-label={`Decrease ${ariaLabel.toLowerCase()}`}
        className={styles.adjustmentButton}
        disabled={decreaseDisabled}
        icon={<Minus />}
        size="lg"
        shouldYield={false}
        onClick={() => onChange(clampValue(value - 1, min, max))}
      />

      <output
        aria-live="polite"
        className={`${fieldStyles.surface} ${fieldStyles.text} ${fieldStyles.numericText} ${styles.value}`}
      >
        {valueLabel}
      </output>

      <IconButton
        aria-label={`Increase ${ariaLabel.toLowerCase()}`}
        className={styles.adjustmentButton}
        disabled={increaseDisabled}
        icon={<Plus />}
        size="lg"
        shouldYield={false}
        onClick={() => onChange(clampValue(value + 1, min, max))}
      />
    </div>
  );
}
