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
import { SessionRenameActionItem } from "./SessionRenameActionItem";

interface SessionManagementRowProps {
  session: SessionManagementSessionSummary;
  sessions: readonly SessionManagementSessionSummary[];
  isActive: boolean;
  isDeleteConfirming: boolean;
  isOpen: boolean;
  isRenameOpen: boolean;
  onCancelDeleteSession: () => void;
  onCloseRename: () => void;
  onDeleteSession: (sessionId: string) => void;
  onDuplicateSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, name: string) => void;
  onRequestDeleteSession: (sessionId: string) => void;
  onToggleActions: (sessionId: string) => void;
  onToggleRename: (sessionId: string) => void;
  onUseSession: (sessionId: string) => void;
}

export function SessionManagementRow({
  session,
  sessions,
  isActive,
  isDeleteConfirming,
  isOpen,
  isRenameOpen,
  onCancelDeleteSession,
  onCloseRename,
  onDeleteSession,
  onDuplicateSession,
  onRenameSession,
  onRequestDeleteSession,
  onToggleActions,
  onToggleRename,
  onUseSession,
}: SessionManagementRowProps) {
  const actionsLabel = `${isOpen ? "Close" : "Open"} actions for ${
    session.name
  } session`;

  return (
    <SelectableOverflowRow
      actionsLabel={actionsLabel}
      isActionsOpen={isOpen}
      label={session.name}
      selected={isActive}
      selectAriaLabel={`Use ${session.name} session`}
      selectedAriaLabel={`Current session: ${session.name}`}
      subtitle={getSessionSubtitle(session.parts)}
      onSelect={() => onUseSession(session.id)}
      onToggleActions={() => onToggleActions(session.id)}
    >
      <DisclosureList grouped groupGap="section">
        <DisclosureListGroup>
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
