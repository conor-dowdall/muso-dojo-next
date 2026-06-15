"use client";

import { useState } from "react";
import { Maximize2, Plus } from "lucide-react";
import { Heading } from "@/components/ui/typography/Heading";
import { IconButton } from "@/components/ui/buttons/IconButton";
import {
  ControlHeader,
  ControlHeaderCluster,
} from "@/components/ui/control-header/ControlHeader";
import { Dialog } from "@/components/ui/dialog/Dialog";
import { DojoSettingsDialog } from "@/components/dojo-settings/DojoSettingsDialog";
import { useAppStore } from "@/stores/appStore";
import { OverflowMenuButton } from "@/components/ui/object-menu";
import { SessionMenu } from "./SessionMenu";
import styles from "./SessionHeader.module.css";

interface SessionHeaderProps {
  onOpenAddDialog: () => void;
  onOpenSessionsDialog: () => void;
  onEnterPerformanceMode?: () => void;
}

export function SessionHeader({
  onEnterPerformanceMode,
  onOpenAddDialog,
  onOpenSessionsDialog,
}: SessionHeaderProps) {
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const activeSessionId = useAppStore((state) => state.activeSessionId);
  const sessionName = useAppStore(
    (state) =>
      (activeSessionId ? state.sessions[activeSessionId]?.name : null) ??
      "No Sessions Yet",
  );
  const hasActiveSession = activeSessionId !== null;
  const sessionOverflowLabel = "Sessions";

  const openSettingsDialog = () => {
    setDialogKey((currentKey) => currentKey + 1);
    setIsSettingsDialogOpen(true);
  };

  const closeSettingsDialog = () => setIsSettingsDialogOpen(false);

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
          <ControlHeaderCluster gap="cluster">
            <ControlHeaderCluster aria-label="Session actions" role="group">
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
              <OverflowMenuButton
                aria-label={sessionOverflowLabel}
                onClick={onOpenSessionsDialog}
              />
            </ControlHeaderCluster>
            <SessionMenu onOpenDojoSettings={openSettingsDialog} />
          </ControlHeaderCluster>
        }
      />

      <Dialog
        isOpen={isSettingsDialogOpen}
        onClose={closeSettingsDialog}
        size="standard"
      >
        <DojoSettingsDialog key={dialogKey} onClose={closeSettingsDialog} />
      </Dialog>
    </>
  );
}
