"use client";

import {
  type SyntheticEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Check, Copy, Settings, TextCursorInput, Trash2 } from "lucide-react";
import { IconButton } from "@/components/ui/buttons/IconButton";
import {
  DisclosureList,
  DisclosureListAction,
  DisclosureListChoiceItem,
  DisclosureListConfirmAction,
  DisclosureListGroup,
  DisclosureListItem,
  useDisclosureList,
} from "@/components/ui/disclosure-list/DisclosureList";
import { Text } from "@/components/ui/typography/Text";
import { NoteColorSettings } from "@/components/note-colors/NoteColorSettings";
import { type DisplayFormatId } from "@/data/displayFormats";
import { type NoteCollectionKey } from "@musodojo/music-theory-data";
import { type InstrumentNoteEmphasis } from "@/types/instrument-note-emphasis";
import { type SessionNoteColorConfig } from "@/types/note-colors";
import { SessionBatchSettings } from "./SessionBatchSettings";
import {
  getSessionSubtitle,
  normalizeSessionNameForComparison,
  type SessionManagementSessionSummary,
} from "./sessionManagementFormatting";
import { type SessionManagementSettingChoice } from "./sessionManagementTypes";
import styles from "./SessionManagementDialog.module.css";

type SessionActionChoice = "settings";

interface SessionManagementRowProps {
  session: SessionManagementSessionSummary;
  sessions: readonly SessionManagementSessionSummary[];
  initialOpenSetting?: SessionManagementSettingChoice | null;
  isActive: boolean;
  isDeleteConfirming: boolean;
  isOpen: boolean;
  onCancelDeleteSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  onDuplicateSession: (sessionId: string) => void;
  onSessionDisplayFormatIdChange: (
    sessionId: string,
    displayFormatId: DisplayFormatId,
  ) => void;
  onSessionNoteCollectionKeyChange: (
    sessionId: string,
    noteCollectionKey: NoteCollectionKey,
  ) => void;
  onNoteColorConfigChange: (
    sessionId: string,
    noteColorConfig: SessionNoteColorConfig,
  ) => void;
  onSessionNoteEmphasisChange: (
    sessionId: string,
    noteEmphasis: InstrumentNoteEmphasis,
  ) => void;
  onRenameSession: (sessionId: string, name: string) => void;
  onRequestDeleteSession: (sessionId: string) => void;
  onToggleActions: (sessionId: string) => void;
  onUseSession: (sessionId: string) => void;
}

export function SessionManagementRow({
  session,
  sessions,
  initialOpenSetting = null,
  isActive,
  isDeleteConfirming,
  isOpen,
  onCancelDeleteSession,
  onDeleteSession,
  onDuplicateSession,
  onSessionDisplayFormatIdChange,
  onSessionNoteCollectionKeyChange,
  onNoteColorConfigChange,
  onSessionNoteEmphasisChange,
  onRenameSession,
  onRequestDeleteSession,
  onToggleActions,
  onUseSession,
}: SessionManagementRowProps) {
  const nameInputId = useId();
  const nameMessageId = useId();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const hasFocusedInitialNameInput = useRef(false);
  const {
    closeAll: closeSessionActions,
    openChoice: openSessionAction,
    toggleChoice: toggleSessionAction,
  } = useDisclosureList<SessionActionChoice>(
    initialOpenSetting ? "settings" : null,
  );
  const {
    closeAll: closeSessionSettings,
    closeChoice: closeSessionSettingChoice,
    openChoice: openSessionSetting,
    toggleChoice: toggleSessionSetting,
  } = useDisclosureList<SessionManagementSettingChoice>(
    initialOpenSetting,
  );
  const [draftSession, setDraftSession] = useState({
    id: session.id,
    savedName: session.name,
    name: session.name,
  });

  useEffect(() => {
    if (!isOpen) {
      closeSessionActions();
      closeSessionSettings();
    }
  }, [closeSessionActions, closeSessionSettings, isOpen]);

  const closeLocalMenus = () => {
    closeSessionActions();
    closeSessionSettings();
  };

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
    closeSessionSettingChoice("title");
  };

  const {
    canRename,
    draftName,
    hasNameConflict,
    isNameEmpty,
    message: renameMessage,
  } = getRenameState();
  const shouldFocusNameInput = initialOpenSetting === "title";

  useEffect(() => {
    if (!shouldFocusNameInput || !isOpen) {
      hasFocusedInitialNameInput.current = false;
      return;
    }

    if (
      hasFocusedInitialNameInput.current ||
      openSessionAction !== "settings" ||
      openSessionSetting !== "title"
    ) {
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
  }, [isOpen, openSessionAction, openSessionSetting, shouldFocusNameInput]);

  return (
    <DisclosureListChoiceItem
      ariaCurrent={isActive ? "true" : undefined}
      ariaLabel={`${isOpen ? "Close" : "Open"} actions for ${
        session.name
      } session${isActive ? ", selected" : ""}`}
      isOpen={isOpen}
      keepMounted={false}
      label={session.name}
      panelVariant="menu"
      selected={isActive}
      subtitle={getSessionSubtitle(session.parts)}
      onToggle={() => onToggleActions(session.id)}
    >
      <DisclosureList grouped groupGap="related">
        <DisclosureListGroup>
          {!isActive ? (
            <DisclosureListAction
              icon={<Check />}
              label="Use Session"
              onClick={() => {
                closeLocalMenus();
                onUseSession(session.id);
              }}
            />
          ) : null}

          <DisclosureListAction
            icon={<Copy />}
            label="Duplicate"
            onClick={() => {
              closeLocalMenus();
              onDuplicateSession(session.id);
            }}
          />

          <DisclosureListItem
            ariaLabel={`Open settings for ${session.name}`}
            icon={<Settings />}
            isOpen={openSessionAction === "settings"}
            keepMounted
            label="Settings"
            panelVariant="menu"
            onToggle={() => toggleSessionAction("settings")}
          >
            <DisclosureList density="compact">
              <DisclosureListItem
                ariaLabel={`Edit session title. Current: ${session.name}`}
                icon={<TextCursorInput />}
                isOpen={openSessionSetting === "title"}
                keepMounted
                label="Title"
                preview={draftName}
                onToggle={() => toggleSessionSetting("title")}
              >
                <form className={styles.nameForm} onSubmit={handleRename}>
                  <div className={styles.nameField}>
                    <label className={styles.nameLabel} htmlFor={nameInputId}>
                      Session Title
                    </label>
                    <div className={styles.nameControl}>
                      <input
                        aria-describedby={
                          renameMessage ? nameMessageId : undefined
                        }
                        aria-invalid={isNameEmpty || hasNameConflict}
                        autoComplete="off"
                        className={styles.nameInput}
                        id={nameInputId}
                        ref={nameInputRef}
                        spellCheck={false}
                        value={draftName}
                        onChange={(event) =>
                          setDraftName(event.currentTarget.value)
                        }
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
                        data-tone={
                          isNameEmpty || hasNameConflict ? "danger" : "muted"
                        }
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

              <NoteColorSettings
                isOpen={openSessionSetting === "note-colors"}
                value={session.noteColorConfig}
                onClose={() => closeSessionSettingChoice("note-colors")}
                onToggle={() => toggleSessionSetting("note-colors")}
                onChange={(noteColorConfig) =>
                  onNoteColorConfigChange(session.id, noteColorConfig)
                }
              />

              <SessionBatchSettings
                openSetting={openSessionSetting}
                session={session}
                onDisplayFormatIdChange={onSessionDisplayFormatIdChange}
                onNoteCollectionKeyChange={onSessionNoteCollectionKeyChange}
                onNoteEmphasisChange={onSessionNoteEmphasisChange}
                onToggleSetting={toggleSessionSetting}
              />
            </DisclosureList>
          </DisclosureListItem>
        </DisclosureListGroup>

        <DisclosureListGroup>
          <DisclosureListConfirmAction
            confirmAriaLabel={`Confirm deleting ${session.name}. This cannot be undone.`}
            confirmButtonLabel="Delete"
            confirmLabel={`Delete ${session.name}?`}
            icon={<Trash2 />}
            isConfirming={isDeleteConfirming}
            label="Delete"
            tone="danger"
            onCancel={onCancelDeleteSession}
            onConfirm={() => onDeleteSession(session.id)}
            onRequestConfirm={() => onRequestDeleteSession(session.id)}
          />
        </DisclosureListGroup>
      </DisclosureList>
    </DisclosureListChoiceItem>
  );
}
