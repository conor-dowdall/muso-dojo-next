"use client";

import { useMemo } from "react";
import { Library } from "lucide-react";
import {
  DialogContent,
  DialogDoneFooter,
  DialogHeader,
} from "@/components/ui/dialog/Dialog";
import {
  DisclosureList,
  DisclosureListAction,
  DisclosureListGroup,
  useDisclosureList,
} from "@/components/ui/disclosure-list/DisclosureList";
import { NoteColorSettings } from "@/components/note-colors/NoteColorSettings";
import { useAppStore } from "@/stores/appStore";
import { SessionNameSettingsItem } from "./SessionNameSettingsItem";

interface SessionOptionsDialogProps {
  onClose: () => void;
  onOpenSessions: () => void;
}

type SessionOptionChoice = "name" | "note-colors";

function getSessionCountLabel(sessionCount: number) {
  return sessionCount === 1 ? "1 Session" : `${sessionCount} Sessions`;
}

export function SessionOptionsDialog({
  onClose,
  onOpenSessions,
}: SessionOptionsDialogProps) {
  const { closeChoice, openChoice, toggleChoice } =
    useDisclosureList<SessionOptionChoice>();
  const activeSessionId = useAppStore((state) => state.activeSessionId);
  const sessionsById = useAppStore((state) => state.sessions);
  const defaultSessionNoteColorConfig = useAppStore(
    (state) => state.preferences.defaultSessionNoteColorConfig,
  );
  const renameSession = useAppStore((state) => state.renameSession);
  const setSessionNoteColorConfig = useAppStore(
    (state) => state.setSessionNoteColorConfig,
  );
  const setDefaultSessionNoteColorConfig = useAppStore(
    (state) => state.setDefaultSessionNoteColorConfig,
  );
  const sessions = useMemo(
    () =>
      Object.values(sessionsById).map((session) => ({
        id: session.id,
        name: session.name,
      })),
    [sessionsById],
  );
  const activeSession = activeSessionId
    ? sessionsById[activeSessionId]
    : undefined;

  return (
    <>
      <DialogHeader title="Session Options" onClose={onClose} />
      <DialogContent menuRhythm="standard">
        {activeSession ? (
          <DisclosureList grouped groupGap="section">
            <DisclosureListGroup>
              <SessionNameSettingsItem
                isOpen={openChoice === "name"}
                session={activeSession}
                sessions={sessions}
                onClose={() => closeChoice("name")}
                onRenameSession={renameSession}
                onToggle={() => toggleChoice("name")}
              />

              <NoteColorSettings
                defaultValue={defaultSessionNoteColorConfig}
                isOpen={openChoice === "note-colors"}
                value={activeSession.noteColorConfig}
                onClose={() => closeChoice("note-colors")}
                onToggle={() => toggleChoice("note-colors")}
                onChange={(noteColorConfig) =>
                  setSessionNoteColorConfig(activeSession.id, noteColorConfig)
                }
                onUseForNewSessions={setDefaultSessionNoteColorConfig}
              />
            </DisclosureListGroup>

            <DisclosureListGroup>
              <DisclosureListAction
                aria-label="Open sessions"
                icon={<Library />}
                label="Sessions"
                subtitle={getSessionCountLabel(sessions.length)}
                onClick={onOpenSessions}
              />
            </DisclosureListGroup>
          </DisclosureList>
        ) : null}
      </DialogContent>
      <DialogDoneFooter onDone={onClose} />
    </>
  );
}
