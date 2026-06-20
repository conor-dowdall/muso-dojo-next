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
import { SessionTempoActionItem } from "./SessionTempoActionItem";

interface SessionManagementRowProps {
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
          <SessionTempoActionItem
            isOpen={isTempoOpen}
            session={session}
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
