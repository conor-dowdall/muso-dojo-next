"use client";

import { InlineRenameActionItem } from "@/components/ui/inline-rename/InlineRenameActionItem";
import {
  normalizeSessionNameForComparison,
  type SessionManagementSessionSummary,
} from "./sessionManagementFormatting";

interface SessionRenameActionItemProps {
  isOpen: boolean;
  label?: string;
  onClose: () => void;
  onRenameSession: (sessionId: string, name: string) => void;
  onToggle: () => void;
  session: Pick<SessionManagementSessionSummary, "id" | "name">;
  sessions: readonly Pick<SessionManagementSessionSummary, "id" | "name">[];
  shouldFocusInput?: boolean;
}

/** Shared inline action for surfaces that manage a Session's name. */
export function SessionRenameActionItem({
  isOpen,
  label = "Rename",
  onClose,
  onRenameSession,
  onToggle,
  session,
  sessions,
  shouldFocusInput = false,
}: SessionRenameActionItemProps) {
  return (
    <InlineRenameActionItem
      ariaLabel={`Rename session. Current name: ${session.name}`}
      fieldLabel="Session Name"
      isNameAvailable={(name) =>
        !sessions.some(
          (candidateSession) =>
            candidateSession.id !== session.id &&
            normalizeSessionNameForComparison(candidateSession.name) ===
              normalizeSessionNameForComparison(name),
        )
      }
      isOpen={isOpen}
      label={label}
      shouldFocusInput={shouldFocusInput}
      value={session.name}
      onClose={onClose}
      onRename={(name) => onRenameSession(session.id, name)}
      onToggle={onToggle}
    />
  );
}
