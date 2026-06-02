"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  DialogContent,
  DialogDoneFooter,
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
import styles from "./SessionManagementDialog.module.css";

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
  const [deleteConfirmationSessionId, setDeleteConfirmationSessionId] =
    useState<string | null>(null);
  const { activeSessionId, sessions: sessionList } = useAppStore(
    selectSessionManagementSnapshot,
  );
  const setActiveSessionId = useAppStore((state) => state.setActiveSessionId);
  const addSession = useAppStore((state) => state.addSession);
  const cloneSession = useAppStore((state) => state.cloneSession);
  const removeSession = useAppStore((state) => state.removeSession);

  const activeSession =
    (activeSessionId
      ? sessionList.find((session) => session.id === activeSessionId)
      : undefined) ?? sessionList[0];

  const handleAddSession = () => {
    addSession();
    setOpenSessionId(null);
    setDeleteConfirmationSessionId(null);
  };

  const handleSessionOptionsToggle = (sessionId: string) => {
    setOpenSessionId((currentSessionId) =>
      currentSessionId === sessionId ? null : sessionId,
    );
    setDeleteConfirmationSessionId(null);
  };

  const handleSelectSession = (sessionId: string) => {
    if (sessionId === activeSession?.id) {
      return;
    }

    setActiveSessionId(sessionId);
    setOpenSessionId(null);
    setDeleteConfirmationSessionId(null);
  };

  const handleCloneSession = (sessionId: string) => {
    cloneSession(sessionId);
    setOpenSessionId(null);
    setDeleteConfirmationSessionId(null);
  };

  const handleDeleteSession = (sessionId: string) => {
    removeSession(sessionId);
    setOpenSessionId(null);
    setDeleteConfirmationSessionId(null);
  };

  return (
    <>
      <DialogHeader title="Sessions" onClose={onClose} />
      <DialogContent menuRhythm="standard">
        <section
          className={styles.sessionListSection}
          aria-label="Session choices"
        >
          <DisclosureList grouped groupGap="section">
            <DisclosureListGroup>
              <DisclosureListAction
                icon={<Plus />}
                label="New Session"
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
                    session={session}
                    onCancelDeleteSession={() =>
                      setDeleteConfirmationSessionId(null)
                    }
                    onDeleteSession={handleDeleteSession}
                    onDuplicateSession={handleCloneSession}
                    onRequestDeleteSession={setDeleteConfirmationSessionId}
                    onToggleOptions={handleSessionOptionsToggle}
                    onUseSession={handleSelectSession}
                  />
                ))
              )}
            </DisclosureListGroup>
          </DisclosureList>
        </section>
      </DialogContent>
      <DialogDoneFooter onDone={onClose} />
    </>
  );
}
