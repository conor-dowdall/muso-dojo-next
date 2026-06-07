"use client";

import { useState } from "react";
import { Maximize2, Plus } from "lucide-react";
import { Heading } from "@/components/ui/typography/Heading";
import { IconButton } from "@/components/ui/buttons/IconButton";
import { ControlHeader } from "@/components/ui/control-header/ControlHeader";
import { Dialog } from "@/components/ui/dialog/Dialog";
import { DojoSettingsDialog } from "@/components/dojo-settings/DojoSettingsDialog";
import { useAppStore } from "@/stores/appStore";
import { OverflowMenuButton } from "@/components/ui/object-menu";
import { SessionManagementDialog } from "./SessionManagementDialog";
import { SessionMenu } from "./SessionMenu";
import { SessionPulseControl } from "./SessionPulseControl";
import styles from "./SessionHeader.module.css";

interface SessionHeaderProps {
  onOpenAddDialog: () => void;
  onEnterPerformanceMode?: () => void;
}

export function SessionHeader({
  onEnterPerformanceMode,
  onOpenAddDialog,
}: SessionHeaderProps) {
  const [dialogIntent, setDialogIntent] = useState<
    { kind: "sessions" } | { kind: "settings" } | null
  >(null);
  const [dialogKey, setDialogKey] = useState(0);
  const activeSessionId = useAppStore((state) => state.activeSessionId);
  const sessionName = useAppStore(
    (state) =>
      (activeSessionId ? state.sessions[activeSessionId]?.name : null) ??
      "No Sessions Yet",
  );
  const hasActiveSession = activeSessionId !== null;
  const isDialogOpen = dialogIntent !== null;
  const sessionOverflowLabel = "Sessions";

  const openDialog = (intent: { kind: "sessions" } | { kind: "settings" }) => {
    setDialogKey((currentKey) => currentKey + 1);
    setDialogIntent(intent);
  };

  const closeDialog = () => setDialogIntent(null);

  return (
    <>
      <ControlHeader
        className={styles.header}
        primary={
          <>
            <Heading as="h1" className={styles.title} size="base">
              {sessionName}
            </Heading>
          </>
        }
        actions={
          <>
            <span
              className={styles.sessionActionGroup}
              role="group"
              aria-label="Session controls"
            >
              <IconButton
                aria-label="Add to session"
                disabled={!hasActiveSession}
                icon={<Plus />}
                size="sm"
                tooltip="Add to session"
                variant="filled"
                onClick={onOpenAddDialog}
              />
              <IconButton
                aria-label="Enter performance mode"
                disabled={!hasActiveSession || !onEnterPerformanceMode}
                icon={<Maximize2 />}
                size="sm"
                shouldYield={false}
                tooltip="Performance mode"
                onClick={onEnterPerformanceMode}
              />
              {activeSessionId ? (
                <SessionPulseControl sessionId={activeSessionId} />
              ) : null}
              <OverflowMenuButton
                aria-label={sessionOverflowLabel}
                onClick={() => openDialog({ kind: "sessions" })}
              />
            </span>
            <SessionMenu
              onOpenDojoSettings={() => openDialog({ kind: "settings" })}
            />
          </>
        }
      />

      <Dialog isOpen={isDialogOpen} onClose={closeDialog} size="standard">
        {dialogIntent?.kind === "settings" ? (
          <DojoSettingsDialog key={dialogKey} onClose={closeDialog} />
        ) : dialogIntent?.kind === "sessions" ? (
          <SessionManagementDialog key={dialogKey} onClose={closeDialog} />
        ) : null}
      </Dialog>
    </>
  );
}
