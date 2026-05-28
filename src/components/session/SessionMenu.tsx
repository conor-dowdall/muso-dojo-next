"use client";

import { Palette } from "lucide-react";
import { IconButton } from "@/components/ui/buttons/IconButton";
import { ObjectMenuTriggerButton } from "@/components/ui/object-menu";

interface SessionMenuProps {
  activeSessionId: string | null;
  onOpenManageSessions: () => void;
  onOpenNoteColors: (sessionId: string) => void;
}

export function SessionMenu({
  activeSessionId,
  onOpenManageSessions,
  onOpenNoteColors,
}: SessionMenuProps) {
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

          onOpenNoteColors(activeSessionId);
        }}
      />
      <ObjectMenuTriggerButton level="session" onClick={onOpenManageSessions} />
    </>
  );
}
