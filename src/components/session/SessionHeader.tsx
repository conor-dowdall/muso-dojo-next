"use client";

import { useState } from "react";
import { Maximize2, Palette, Pencil, Plus } from "lucide-react";
import { Heading } from "@/components/ui/typography/Heading";
import { IconButton } from "@/components/ui/buttons/IconButton";
import { ControlHeader } from "@/components/ui/control-header/ControlHeader";
import { Dialog } from "@/components/ui/dialog/Dialog";
import { DojoSettingsDialog } from "@/components/app-settings/DojoSettingsDialog";
import { useAppStore } from "@/stores/appStore";
import { ObjectMenuTriggerButton } from "@/components/ui/object-menu";
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
    | { kind: "settings" }
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
      | { kind: "settings" }
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
                className={styles.titleUtilityButton}
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
            <span
              className={styles.sessionActionGroup}
              role="group"
              aria-label="Session actions"
            >
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

                  openSessionSetting(activeSessionId, "note-colors");
                }}
              />
              <ObjectMenuTriggerButton
                aria-label="Manage sessions"
                level="session"
                onClick={() => openDialog({ kind: "manage" })}
              />
            </span>
            <SessionMenu
              onOpenDojoSettings={() => openDialog({ kind: "settings" })}
            />
          </>
        }
      />

      <Dialog
        isOpen={isDialogOpen}
        onClose={closeDialog}
        size={dialogIntent?.kind === "settings" ? "md" : "lg"}
      >
        {dialogIntent?.kind === "settings" ? (
          <DojoSettingsDialog key={dialogKey} onClose={closeDialog} />
        ) : (
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
        )}
      </Dialog>
    </>
  );
}
