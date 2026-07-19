"use client";

import { Check } from "lucide-react";
import { type Ref, useId } from "react";
import { Button } from "@/components/ui/buttons/Button";
import { IconButton } from "@/components/ui/buttons/IconButton";
import fieldStyles from "@/components/ui/control-field/ControlField.module.css";
import { Text } from "@/components/ui/typography/Text";
import styles from "./NamedLibraryItemSaveField.module.css";

interface NamedLibraryItemSaveFieldProps {
  disabled: boolean;
  label: string;
  saveAriaLabel: string;
  saveLabel?: string;
  value: string;
  errorMessage?: string;
  inputRef?: Ref<HTMLInputElement>;
  onChange: (value: string) => void;
}

export function NamedLibraryItemSaveField({
  disabled,
  errorMessage,
  inputRef,
  label,
  saveAriaLabel,
  saveLabel,
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
          ref={inputRef}
          placeholder={label}
          spellCheck={false}
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
        />
        {saveLabel ? (
          <Button
            aria-label={saveAriaLabel}
            disabled={disabled}
            label={saveLabel}
            shouldYield={false}
            size="lg"
            type="submit"
          />
        ) : (
          <IconButton
            aria-label={saveAriaLabel}
            disabled={disabled}
            icon={<Check />}
            shouldYield={false}
            size="lg"
            type="submit"
          />
        )}
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
