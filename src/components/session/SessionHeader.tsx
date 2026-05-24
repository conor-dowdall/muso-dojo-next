"use client";

import { Maximize2, Plus } from "lucide-react";
import { Heading } from "@/components/ui/typography/Heading";
import { IconButton } from "@/components/ui/buttons/IconButton";
import { useAppStore } from "@/stores/appStore";
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
  const activeSessionId = useAppStore((state) => state.activeSessionId);
  const sessionName = useAppStore(
    (state) =>
      (activeSessionId ? state.sessions[activeSessionId]?.name : null) ??
      "No Sessions Yet",
  );
  const hasActiveSession = activeSessionId !== null;

  return (
    <header className={styles.header}>
      <Heading as="h1" className={styles.title} size="base">
        {sessionName}
      </Heading>
      <div className={styles.actions}>
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
        <SessionMenu activeSessionId={activeSessionId} />
      </div>
    </header>
  );
}
