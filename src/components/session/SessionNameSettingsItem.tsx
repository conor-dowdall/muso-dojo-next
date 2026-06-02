"use client";

import { type SyntheticEvent, useEffect, useId, useRef, useState } from "react";
import { Check, TextCursorInput } from "lucide-react";
import { IconButton } from "@/components/ui/buttons/IconButton";
import { DisclosureListItem } from "@/components/ui/disclosure-list/DisclosureList";
import { Text } from "@/components/ui/typography/Text";
import {
  normalizeSessionNameForComparison,
  type SessionManagementSessionSummary,
} from "./sessionManagementFormatting";
import styles from "./SessionNameSettingsItem.module.css";

interface SessionNameSettingsItemProps {
  isOpen: boolean;
  onClose: () => void;
  onRenameSession: (sessionId: string, name: string) => void;
  onToggle: () => void;
  session: Pick<SessionManagementSessionSummary, "id" | "name">;
  sessions: readonly Pick<SessionManagementSessionSummary, "id" | "name">[];
  shouldFocusInput?: boolean;
}

export function SessionNameSettingsItem({
  isOpen,
  onClose,
  onRenameSession,
  onToggle,
  session,
  sessions,
  shouldFocusInput = false,
}: SessionNameSettingsItemProps) {
  const nameInputId = useId();
  const nameMessageId = useId();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const hasFocusedInitialNameInput = useRef(false);
  const [draftSession, setDraftSession] = useState({
    id: session.id,
    savedName: session.name,
    name: session.name,
  });

  const setDraftName = (name: string) => {
    setDraftSession({
      id: session.id,
      savedName: session.name,
      name,
    });
  };

  const getDraftName = () =>
    draftSession.id === session.id && draftSession.savedName === session.name
      ? draftSession.name
      : session.name;

  const getRenameState = () => {
    const draftName = getDraftName();
    const trimmedDraftName = draftName.trim();
    const hasNameChanged = trimmedDraftName !== session.name;
    const isNameEmpty = trimmedDraftName.length === 0;
    const hasNameConflict = sessions.some(
      (candidateSession) =>
        candidateSession.id !== session.id &&
        normalizeSessionNameForComparison(candidateSession.name) ===
          normalizeSessionNameForComparison(trimmedDraftName),
    );

    return {
      canRename: hasNameChanged && !isNameEmpty && !hasNameConflict,
      draftName,
      hasNameConflict,
      isNameEmpty,
      message: isNameEmpty
        ? "Add a name before saving."
        : hasNameConflict
          ? "That session name is already in use."
          : "",
      trimmedDraftName,
    };
  };

  const handleRename = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    const { canRename, trimmedDraftName } = getRenameState();

    if (!canRename) {
      return;
    }

    onRenameSession(session.id, trimmedDraftName);
    setDraftSession({
      id: session.id,
      savedName: trimmedDraftName,
      name: trimmedDraftName,
    });
    onClose();
  };

  const {
    canRename,
    draftName,
    hasNameConflict,
    isNameEmpty,
    message: renameMessage,
  } = getRenameState();

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
    <DisclosureListItem
      ariaLabel={`Edit session name. Current: ${session.name}`}
      icon={<TextCursorInput />}
      isOpen={isOpen}
      keepMounted
      label="Name"
      preview={draftName}
      onToggle={onToggle}
    >
      <form className={styles.nameForm} onSubmit={handleRename}>
        <div className={styles.nameField}>
          <label className={styles.nameLabel} htmlFor={nameInputId}>
            Session Name
          </label>
          <div className={styles.nameControl}>
            <input
              aria-describedby={renameMessage ? nameMessageId : undefined}
              aria-invalid={isNameEmpty || hasNameConflict}
              autoComplete="off"
              className={styles.nameInput}
              id={nameInputId}
              ref={nameInputRef}
              spellCheck={false}
              value={draftName}
              onChange={(event) => setDraftName(event.currentTarget.value)}
            />
            <IconButton
              aria-label="Save session name"
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
              data-tone={isNameEmpty || hasNameConflict ? "danger" : "muted"}
              id={nameMessageId}
              size="xs"
              variant="muted"
            >
              {renameMessage}
            </Text>
          ) : null}
        </div>
      </form>
    </DisclosureListItem>
  );
}
