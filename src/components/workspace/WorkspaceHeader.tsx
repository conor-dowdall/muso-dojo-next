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
      state.workspaces[activeWorkspaceId]?.name ?? "Practice Workspace",
  );
  const addMusicGroup = useAppStore((state) => state.addMusicGroup);

  return (
    <header className={styles.header}>
      <Heading as="h1" className={styles.title} size="base">
        {workspaceName}
      </Heading>
      <div className={styles.actions}>
        <IconButton
          aria-label="Add music group"
          icon={<Plus />}
          size="sm"
          variant="outline"
          onClick={() => addMusicGroup(activeWorkspaceId)}
        />
        <WorkspaceMenu />
      </div>
    </header>
  );
}
