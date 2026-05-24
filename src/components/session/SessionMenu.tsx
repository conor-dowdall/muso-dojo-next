"use client";

import { useState } from "react";
import { MoreHorizontal, Palette } from "lucide-react";
import { Dialog } from "@/components/ui/dialog/Dialog";
import { IconButton } from "@/components/ui/buttons/IconButton";
import { SessionManagementDialog } from "./SessionManagementDialog";

interface SessionMenuProps {
  activeSessionId: string | null;
}

type SessionDialogIntent =
  | { kind: "manage" }
  | { kind: "note-colors"; sessionId: string };

export function SessionMenu({ activeSessionId }: SessionMenuProps) {
  const [dialogIntent, setDialogIntent] = useState<SessionDialogIntent | null>(
    null,
  );
  const [dialogKey, setDialogKey] = useState(0);

  const isDialogOpen = dialogIntent !== null;

  const openDialog = (intent: SessionDialogIntent) => {
    setDialogKey((currentKey) => currentKey + 1);
    setDialogIntent(intent);
  };

  const closeDialog = () => setDialogIntent(null);

  return (
    <>
      <IconButton
        aria-label="Edit session note colors"
        disabled={!activeSessionId}
        icon={<Palette />}
        size="sm"
        tooltip="Session note colors"
        onClick={() => {
          if (!activeSessionId) {
            return;
          }

          openDialog({ kind: "note-colors", sessionId: activeSessionId });
        }}
      />
      <IconButton
        aria-label="Session menu"
        icon={<MoreHorizontal />}
        size="sm"
        onClick={() => openDialog({ kind: "manage" })}
      />

      <Dialog isOpen={isDialogOpen} onClose={closeDialog} size="lg">
        <SessionManagementDialog
          key={dialogKey}
          initialOpenNoteColorsSessionId={
            dialogIntent?.kind === "note-colors" ? dialogIntent.sessionId : null
          }
          onClose={closeDialog}
        />
      </Dialog>
    </>
  );
}
