"use client";

import { useState } from "react";
import { Maximize2, Pencil, Plus } from "lucide-react";
import { Heading } from "@/components/ui/typography/Heading";
import { IconButton } from "@/components/ui/buttons/IconButton";
import { ControlHeader } from "@/components/ui/control-header/ControlHeader";
import { Dialog } from "@/components/ui/dialog/Dialog";
import { useAppStore } from "@/stores/appStore";
import { SessionManagementDialog } from "./SessionManagementDialog";
import { type SessionManagementSettingChoice } from "./sessionManagementTypes";
import { SessionMenu } from "./SessionMenu";
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
    | { kind: "manage" }
    | {
        kind: "setting";
        sessionId: string;
        setting: SessionManagementSettingChoice;
      }
    | null
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

  const openDialog = (
    intent:
      | { kind: "manage" }
      | {
          kind: "setting";
          sessionId: string;
          setting: SessionManagementSettingChoice;
        },
  ) => {
    setDialogKey((currentKey) => currentKey + 1);
    setDialogIntent(intent);
  };

  const openSessionSetting = (
    sessionId: string,
    setting: SessionManagementSettingChoice,
  ) => openDialog({ kind: "setting", sessionId, setting });

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
            {activeSessionId ? (
              <IconButton
                aria-label="Rename session"
                className={styles.titleEditButton}
                icon={<Pencil />}
                size="xs"
                tooltip="Rename session"
                variant="ghost"
                onClick={() => openSessionSetting(activeSessionId, "title")}
              />
            ) : null}
          </>
        }
        actions={
          <>
            <IconButton
              aria-label="Add to session"
              disabled={!hasActiveSession}
              icon={<Plus />}
              size="sm"
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
            <SessionMenu
              activeSessionId={activeSessionId}
              onOpenManageSessions={() => openDialog({ kind: "manage" })}
              onOpenNoteColors={(sessionId) =>
                openSessionSetting(sessionId, "note-colors")
              }
            />
          </>
        }
      />

      <Dialog isOpen={isDialogOpen} onClose={closeDialog} size="lg">
        <SessionManagementDialog
          key={dialogKey}
          initialOpenSetting={
            dialogIntent?.kind === "setting"
              ? {
                  sessionId: dialogIntent.sessionId,
                  setting: dialogIntent.setting,
                }
              : null
          }
          onClose={closeDialog}
        />
      </Dialog>
    </>
  );
}
