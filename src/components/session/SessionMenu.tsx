"use client";

import { type ReactNode } from "react";
import { Palette } from "lucide-react";
import { IconButton } from "@/components/ui/buttons/IconButton";
import { ObjectMenuTriggerButton } from "@/components/ui/object-menu";

interface SessionMenuProps {
  activeSessionId: string | null;
  beforeMenuTrigger?: ReactNode;
  onOpenManageSessions: () => void;
  onOpenNoteColors: (sessionId: string) => void;
}

export function SessionMenu({
  activeSessionId,
  beforeMenuTrigger,
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
      {beforeMenuTrigger}
      <ObjectMenuTriggerButton
        aria-label="Manage sessions"
        level="session"
        onClick={onOpenManageSessions}
      />
    </>
  );
}
