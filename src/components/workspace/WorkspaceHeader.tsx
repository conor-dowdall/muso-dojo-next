"use client";

import { Plus } from "lucide-react";
import { Heading } from "@/components/ui/typography/Heading";
import { IconButton } from "@/components/ui/buttons/IconButton";
import { useAppStore } from "@/stores/appStore";
import { WorkspaceMenu } from "./WorkspaceMenu";
import styles from "./WorkspaceHeader.module.css";

export function WorkspaceHeader() {
  const activeWorkspaceId = useAppStore((state) => state.activeWorkspaceId);
  const workspaceName = useAppStore(
    (state) =>
      (activeWorkspaceId ? state.workspaces[activeWorkspaceId]?.name : null) ??
      "No workspaces yet",
  );
  const addMusicGroup = useAppStore((state) => state.addMusicGroup);
  const hasActiveWorkspace = activeWorkspaceId !== null;

  return (
    <header className={styles.header}>
      <Heading as="h1" className={styles.title} size="base">
        {workspaceName}
      </Heading>
      <div className={styles.actions}>
        <IconButton
          aria-label="Add group"
          disabled={!hasActiveWorkspace}
          icon={<Plus />}
          size="sm"
          onClick={() => {
            if (activeWorkspaceId) {
              addMusicGroup(activeWorkspaceId);
            }
          }}
        />
        <WorkspaceMenu />
      </div>
    </header>
  );
}
