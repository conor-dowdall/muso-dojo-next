"use client";

import {
  DisclosureList,
  DisclosureListGroup,
} from "@/components/ui/disclosure-list/DisclosureList";
import { ObjectManagementGroup } from "@/components/ui/object-menu";
import { SelectableOverflowRow } from "@/components/ui/selectable-overflow-row";
import {
  getSessionSubtitle,
  type SessionManagementSessionSummary,
} from "./sessionManagementFormatting";
import { TempoActionItem } from "@/components/tempo/TempoActionItem";
import { SessionRenameActionItem } from "./SessionRenameActionItem";

interface SessionManagementRowProps {
  arrangementReferenceCount: number;
  session: SessionManagementSessionSummary;
  sessions: readonly SessionManagementSessionSummary[];
  isActive: boolean;
  isDeleteConfirming: boolean;
  isOpen: boolean;
  isRenameOpen: boolean;
  isTempoOpen: boolean;
  onCancelDeleteSession: () => void;
  onCloseRename: () => void;
  onDeleteSession: (sessionId: string) => void;
  onDuplicateSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, name: string) => void;
  onSetTempoBpm: (sessionId: string, tempoBpm: number) => void;
  onRequestDeleteSession: (sessionId: string) => void;
  onToggleActions: (sessionId: string) => void;
  onToggleRename: (sessionId: string) => void;
  onToggleTempo: (sessionId: string) => void;
  onUseSession: (sessionId: string) => void;
}

export function SessionManagementRow({
  arrangementReferenceCount,
  session,
  sessions,
  isActive,
  isDeleteConfirming,
  isOpen,
  isRenameOpen,
  isTempoOpen,
  onCancelDeleteSession,
  onCloseRename,
  onDeleteSession,
  onDuplicateSession,
  onRenameSession,
  onSetTempoBpm,
  onRequestDeleteSession,
  onToggleActions,
  onToggleRename,
  onToggleTempo,
  onUseSession,
}: SessionManagementRowProps) {
  const actionsLabel = `${isOpen ? "Close" : "Open"} actions for ${
    session.name
  } session`;
  const arrangementImpact =
    arrangementReferenceCount === 1
      ? "1 Arrangement references this session."
      : `${arrangementReferenceCount} Arrangements reference this session.`;
  const deleteConfirmLabel =
    arrangementReferenceCount > 0
      ? `Delete ${session.name}? ${arrangementImpact}`
      : undefined;

  return (
    <SelectableOverflowRow
      actionsLabel={actionsLabel}
      isActionsOpen={isOpen}
      label={session.name}
      selected={isActive}
      selectAriaLabel={`Use ${session.name} session`}
      selectedAriaLabel={`Current session: ${session.name}`}
      subtitle={getSessionSubtitle(session.parts, session.tempoBpm)}
      onSelect={() => onUseSession(session.id)}
      onToggleActions={() => onToggleActions(session.id)}
    >
      <DisclosureList grouped groupGap="section">
        <DisclosureListGroup>
          <TempoActionItem
            entityKind="session"
            item={session}
            isOpen={isTempoOpen}
            onTempoBpmChange={onSetTempoBpm}
            onToggle={() => onToggleTempo(session.id)}
          />
          <SessionRenameActionItem
            isOpen={isRenameOpen}
            session={session}
            sessions={sessions}
            shouldFocusInput
            onClose={onCloseRename}
            onRenameSession={onRenameSession}
            onToggle={() => onToggleRename(session.id)}
          />
        </DisclosureListGroup>
        <ObjectManagementGroup
          dangerConfirmAriaLabel={
            deleteConfirmLabel
              ? `Confirm deleting ${session.name}. ${arrangementImpact} This cannot be undone.`
              : undefined
          }
          dangerConfirmLabel={deleteConfirmLabel}
          isDangerConfirming={isDeleteConfirming}
          kind="session"
          objectName={session.name}
          onCancelDangerConfirm={onCancelDeleteSession}
          onDanger={() => onDeleteSession(session.id)}
          onDuplicate={() => onDuplicateSession(session.id)}
          onRequestDangerConfirm={() => onRequestDeleteSession(session.id)}
        />
      </DisclosureList>
    </SelectableOverflowRow>
  );
}
