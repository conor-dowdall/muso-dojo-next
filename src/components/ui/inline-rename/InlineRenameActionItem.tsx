"use client";

import { type SyntheticEvent, useEffect, useId, useRef, useState } from "react";
import { Check, Pencil } from "lucide-react";
import { IconButton } from "@/components/ui/buttons/IconButton";
import fieldStyles from "@/components/ui/control-field/ControlField.module.css";
import { DisclosureListActionItem } from "@/components/ui/disclosure-list/DisclosureList";
import { Text } from "@/components/ui/typography/Text";
import styles from "./InlineRenameActionItem.module.css";

interface InlineRenameActionItemProps {
  ariaLabel: string;
  fieldLabel: string;
  isNameAvailable: (name: string) => boolean;
  isOpen: boolean;
  onClose: () => void;
  onRename: (name: string) => void;
  onToggle: () => void;
  shouldFocusInput?: boolean;
  value: string;
}

export function InlineRenameActionItem({
  ariaLabel,
  fieldLabel,
  isNameAvailable,
  isOpen,
  onClose,
  onRename,
  onToggle,
  shouldFocusInput = false,
  value,
}: InlineRenameActionItemProps) {
  const nameInputId = useId();
  const nameMessageId = useId();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const hasFocusedInitialNameInput = useRef(false);
  const [draft, setDraft] = useState({ savedValue: value, value });
  const draftValue = draft.savedValue === value ? draft.value : value;
  const trimmedDraftValue = draftValue.trim();
  const hasNameChanged = trimmedDraftValue !== value;
  const isNameEmpty = trimmedDraftValue.length === 0;
  const hasNameConflict = !isNameEmpty && !isNameAvailable(trimmedDraftValue);
  const canRename = hasNameChanged && !isNameEmpty && !hasNameConflict;
  const renameMessage = isNameEmpty
    ? "Add a name before saving."
    : hasNameConflict
      ? "That name is already in use."
      : "";

  const handleRename = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canRename) {
      return;
    }

    onRename(trimmedDraftValue);
    setDraft({
      savedValue: trimmedDraftValue,
      value: trimmedDraftValue,
    });
    onClose();
  };

  useEffect(() => {
    if (!shouldFocusInput || !isOpen) {
      hasFocusedInitialNameInput.current = false;
      return;
    }

    if (hasFocusedInitialNameInput.current) {
      return;
    }

    let secondFrameId: number | undefined;
    const firstFrameId = window.requestAnimationFrame(() => {
      secondFrameId = window.requestAnimationFrame(() => {
        const input = nameInputRef.current;

        if (!input) {
          return;
        }

        input.scrollIntoView({ block: "nearest", inline: "nearest" });
        input.focus();
        input.select();
        hasFocusedInitialNameInput.current = true;
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrameId);
      if (secondFrameId !== undefined) {
        window.cancelAnimationFrame(secondFrameId);
      }
    };
  }, [isOpen, shouldFocusInput]);

  return (
    <DisclosureListActionItem
      ariaLabel={ariaLabel}
      icon={<Pencil />}
      isOpen={isOpen}
      keepMounted
      label="Rename"
      onToggle={onToggle}
    >
      <form className={styles.nameForm} onSubmit={handleRename}>
        <div className={styles.nameField}>
          <label className={styles.nameLabel} htmlFor={nameInputId}>
            {fieldLabel}
          </label>
          <div className={styles.nameControl}>
            <input
              aria-describedby={renameMessage ? nameMessageId : undefined}
              aria-invalid={isNameEmpty || hasNameConflict}
              autoComplete="off"
              className={`${fieldStyles.surface} ${fieldStyles.text} ${styles.nameInput}`}
              id={nameInputId}
              ref={nameInputRef}
              spellCheck={false}
              value={draftValue}
              onChange={(event) =>
                setDraft({
                  savedValue: value,
                  value: event.currentTarget.value,
                })
              }
            />
            <IconButton
              aria-label={`Save ${fieldLabel.toLowerCase()}`}
              disabled={!canRename}
              icon={<Check />}
              shouldYield={false}
              size="lg"
              type="submit"
            />
          </div>
          {renameMessage ? (
            <Text
              as="span"
              className={styles.nameMessage}
              data-tone="danger"
              id={nameMessageId}
              size="xs"
              variant="muted"
            >
              {renameMessage}
            </Text>
          ) : null}
        </div>
      </form>
    </DisclosureListActionItem>
  );
}
