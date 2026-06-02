"use client";

import { DisclosureList } from "@/components/ui/disclosure-list/DisclosureList";
import { ObjectManagementGroup } from "@/components/ui/object-menu";
import { SelectableOverflowRow } from "@/components/ui/selectable-overflow-row";
import {
  getSessionSubtitle,
  type SessionManagementSessionSummary,
} from "./sessionManagementFormatting";

interface SessionManagementRowProps {
  session: SessionManagementSessionSummary;
  isActive: boolean;
  isDeleteConfirming: boolean;
  isOpen: boolean;
  onCancelDeleteSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  onDuplicateSession: (sessionId: string) => void;
  onRequestDeleteSession: (sessionId: string) => void;
  onToggleOptions: (sessionId: string) => void;
  onUseSession: (sessionId: string) => void;
}

export function SessionManagementRow({
  session,
  isActive,
  isDeleteConfirming,
  isOpen,
  onCancelDeleteSession,
  onDeleteSession,
  onDuplicateSession,
  onRequestDeleteSession,
  onToggleOptions,
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
      onToggleActions={() => onToggleOptions(session.id)}
    >
      <DisclosureList grouped groupGap="section">
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
