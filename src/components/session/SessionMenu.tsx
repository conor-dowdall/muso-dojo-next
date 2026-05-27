"use client";

import { MoreHorizontal, Palette } from "lucide-react";
import { IconButton } from "@/components/ui/buttons/IconButton";

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
      <IconButton
        aria-label="Session menu"
        icon={<MoreHorizontal />}
        size="sm"
        onClick={onOpenManageSessions}
      />
    </>
  );
}
