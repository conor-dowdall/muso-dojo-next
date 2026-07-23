"use client";

import { useState } from "react";
import { LibraryBig, Plus } from "lucide-react";
import {
  DialogContent,
  DialogContentSection,
  DialogCloseFooter,
  DialogHeader,
} from "@/components/ui/dialog/Dialog";
import { Text } from "@/components/ui/typography/Text";
import {
  DisclosureList,
  DisclosureListAction,
  DisclosureListGroup,
} from "@/components/ui/disclosure-list/DisclosureList";
import { type AppStore, useAppStore } from "@/stores/appStore";
import { SessionManagementRow } from "./SessionManagementRow";
import {
  createSessionPartSummary,
  sessionSummaryMatchesSession,
  type SessionManagementSnapshot,
} from "./sessionManagementFormatting";

interface SessionManagementDialogProps {
  onClose: () => void;
}

function createSessionManagementSnapshotSelector() {
  let previousSnapshot: SessionManagementSnapshot | undefined;

  return (state: AppStore): SessionManagementSnapshot => {
    const sourceSessions = Object.values(state.sessions);
    let canReuseSnapshot =
      previousSnapshot !== undefined &&
      previousSnapshot.activeSessionId === state.activeSessionId &&
      previousSnapshot.sessions.length === sourceSessions.length;
    const sessions = sourceSessions.map((session, index) => {
      const previousSession = previousSnapshot?.sessions[index];

      if (
        previousSession &&
        sessionSummaryMatchesSession(previousSession, session)
      ) {
        return previousSession;
      }

      canReuseSnapshot = false;

      return {
        id: session.id,
        name: session.name,
        parts: session.parts.map(createSessionPartSummary),
        tempoBpm: session.tempoBpm ?? 80,
      };
    });

    if (previousSnapshot && canReuseSnapshot) {
      return previousSnapshot;
    }

    previousSnapshot = {
      activeSessionId: state.activeSessionId,
      sessions,
    };

    return previousSnapshot;
  };
}

const selectSessionManagementSnapshot =
  createSessionManagementSnapshotSelector();

export function SessionManagementDialog({
  onClose,
}: SessionManagementDialogProps) {
  const [openSessionId, setOpenSessionId] = useState<string | null>(null);
  const [openRenameSessionId, setOpenRenameSessionId] = useState<string | null>(
    null,
  );
  const [openTempoSessionId, setOpenTempoSessionId] = useState<string | null>(
    null,
  );
  const [deleteConfirmationSessionId, setDeleteConfirmationSessionId] =
    useState<string | null>(null);
  const { activeSessionId, sessions: sessionList } = useAppStore(
    selectSessionManagementSnapshot,
  );
  const setActiveSessionId = useAppStore((state) => state.setActiveSessionId);
  const addSession = useAppStore((state) => state.addSession);
  const cloneSession = useAppStore((state) => state.cloneSession);
  const removeSession = useAppStore((state) => state.removeSession);
  const renameSession = useAppStore((state) => state.renameSession);
  const setSessionTempoBpm = useAppStore((state) => state.setSessionTempoBpm);

  const activeSession =
    (activeSessionId
      ? sessionList.find((session) => session.id === activeSessionId)
      : undefined) ?? sessionList[0];

  const handleAddSession = () => {
    addSession();
    setOpenSessionId(null);
    setOpenRenameSessionId(null);
    setOpenTempoSessionId(null);
    setDeleteConfirmationSessionId(null);
  };

  const handleSessionActionsToggle = (sessionId: string) => {
    setOpenSessionId((currentSessionId) =>
      currentSessionId === sessionId ? null : sessionId,
    );
    setOpenRenameSessionId(null);
    setOpenTempoSessionId(null);
    setDeleteConfirmationSessionId(null);
  };

  const handleSelectSession = (sessionId: string) => {
    if (sessionId === activeSession?.id) {
      return;
    }

    setActiveSessionId(sessionId);
    setOpenSessionId(null);
    setOpenRenameSessionId(null);
    setOpenTempoSessionId(null);
    setDeleteConfirmationSessionId(null);
    onClose();
  };

  const handleCloneSession = (sessionId: string) => {
    cloneSession(sessionId);
    setOpenSessionId(null);
    setOpenRenameSessionId(null);
    setOpenTempoSessionId(null);
    setDeleteConfirmationSessionId(null);
  };

  const handleDeleteSession = (sessionId: string) => {
    removeSession(sessionId);
    setOpenSessionId(null);
    setOpenRenameSessionId(null);
    setOpenTempoSessionId(null);
    setDeleteConfirmationSessionId(null);
  };

  const handleRenameToggle = (sessionId: string) => {
    setOpenRenameSessionId((currentSessionId) =>
      currentSessionId === sessionId ? null : sessionId,
    );
    setOpenTempoSessionId(null);
    setDeleteConfirmationSessionId(null);
  };

  const handleTempoToggle = (sessionId: string) => {
    setOpenTempoSessionId((currentSessionId) =>
      currentSessionId === sessionId ? null : sessionId,
    );
    setOpenRenameSessionId(null);
    setDeleteConfirmationSessionId(null);
  };

  return (
    <>
      <DialogHeader icon={<LibraryBig />} title="Library" onClose={onClose} />
      <DialogContent menuRhythm="standard">
        <DialogContentSection ariaLabel="Session choices">
          <DisclosureList grouped groupGap="section">
            <DisclosureListGroup>
              <DisclosureListAction
                icon={<Plus />}
                label="New Session"
                preventConcurrentClicks
                onClick={handleAddSession}
              />
            </DisclosureListGroup>

            <DisclosureListGroup>
              {sessionList.length === 0 ? (
                <Text as="p" size="sm" variant="muted">
                  No Sessions
                </Text>
              ) : (
                sessionList.map((session) => (
                  <SessionManagementRow
                    key={session.id}
                    isActive={session.id === activeSession?.id}
                    isDeleteConfirming={
                      deleteConfirmationSessionId === session.id
                    }
                    isOpen={session.id === openSessionId}
                    isRenameOpen={session.id === openRenameSessionId}
                    isTempoOpen={session.id === openTempoSessionId}
                    session={session}
                    sessions={sessionList}
                    onCancelDeleteSession={() =>
                      setDeleteConfirmationSessionId(null)
                    }
                    onCloseRename={() =>
                      setOpenRenameSessionId((currentSessionId) =>
                        currentSessionId === session.id
                          ? null
                          : currentSessionId,
                      )
                    }
                    onDeleteSession={handleDeleteSession}
                    onDuplicateSession={handleCloneSession}
                    onRenameSession={renameSession}
                    onSetTempoBpm={setSessionTempoBpm}
                    onRequestDeleteSession={setDeleteConfirmationSessionId}
                    onToggleActions={handleSessionActionsToggle}
                    onToggleRename={handleRenameToggle}
                    onToggleTempo={handleTempoToggle}
                    onUseSession={handleSelectSession}
                  />
                ))
              )}
            </DisclosureListGroup>
          </DisclosureList>
        </DialogContentSection>
      </DialogContent>
      <DialogCloseFooter onClose={onClose} />
    </>
  );
}
