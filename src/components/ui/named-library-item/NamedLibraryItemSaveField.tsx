"use client";

import { Check } from "lucide-react";
import { useId } from "react";
import { IconButton } from "@/components/ui/buttons/IconButton";
import fieldStyles from "@/components/ui/control-field/ControlField.module.css";
import { Text } from "@/components/ui/typography/Text";
import styles from "./NamedLibraryItemSaveField.module.css";

interface NamedLibraryItemSaveFieldProps {
  disabled: boolean;
  label: string;
  saveAriaLabel: string;
  value: string;
  errorMessage?: string;
  onChange: (value: string) => void;
}

export function NamedLibraryItemSaveField({
  disabled,
  errorMessage,
  label,
  saveAriaLabel,
  value,
  onChange,
}: NamedLibraryItemSaveFieldProps) {
  const inputId = useId();
  const messageId = useId();

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
      </label>
      <div className={styles.control}>
        <input
          aria-describedby={errorMessage ? messageId : undefined}
          aria-invalid={Boolean(errorMessage) || undefined}
          autoComplete="off"
          className={`${fieldStyles.surface} ${fieldStyles.text} ${styles.input}`}
          id={inputId}
          placeholder={label}
          spellCheck={false}
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
        />
        <IconButton
          aria-label={saveAriaLabel}
          disabled={disabled}
          icon={<Check />}
          shouldYield={false}
          size="lg"
          type="submit"
        />
      </div>
      {errorMessage ? (
        <Text
          as="span"
          className={styles.message}
          id={messageId}
          size="xs"
          variant="muted"
        >
          {errorMessage}
        </Text>
      ) : null}
    </div>
  );
}
