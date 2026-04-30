"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Dialog } from "@/components/ui/dialog/Dialog";
import { Heading } from "@/components/ui/typography/Heading";
import { IconButton } from "@/components/ui/buttons/IconButton";
import { useAppStore } from "@/stores/appStore";
import { createChordProgressionGroups } from "@/utils/workspace/createChordProgressionGroups";
import { createDefaultMusicGroupConfig } from "@/utils/workspace/createWorkspaceEntities";
import { WorkspaceMenu } from "./WorkspaceMenu";
import { AddToWorkspaceDialog } from "./AddToWorkspaceDialog";
import styles from "./WorkspaceHeader.module.css";

export function WorkspaceHeader() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const activeWorkspaceId = useAppStore((state) => state.activeWorkspaceId);
  const workspaceName = useAppStore(
    (state) =>
      (activeWorkspaceId ? state.workspaces[activeWorkspaceId]?.name : null) ??
      "No workspaces yet",
  );
  const addMusicGroup = useAppStore((state) => state.addMusicGroup);
  const addMusicGroups = useAppStore((state) => state.addMusicGroups);
  const replaceMusicGroups = useAppStore((state) => state.replaceMusicGroups);
  const hasActiveWorkspace = activeWorkspaceId !== null;
  const closeAddDialog = () => setIsAddDialogOpen(false);

  return (
    <>
      <header className={styles.header}>
        <Heading as="h1" className={styles.title} size="base">
          {workspaceName}
        </Heading>
        <div className={styles.actions}>
          <IconButton
            aria-label="Add to workspace"
            disabled={!hasActiveWorkspace}
            icon={<Plus />}
            size="sm"
            onClick={() => setIsAddDialogOpen(true)}
          />
          <WorkspaceMenu />
        </div>
      </header>

      <Dialog isOpen={isAddDialogOpen} onClose={closeAddDialog} size="lg">
        <AddToWorkspaceDialog
          onAddBlankGroup={({ replaceWorkspace }) => {
            if (activeWorkspaceId) {
              if (replaceWorkspace) {
                replaceMusicGroups(activeWorkspaceId, [
                  createDefaultMusicGroupConfig(),
                ]);
                return;
              }

              addMusicGroup(activeWorkspaceId);
            }
          }}
          onAddChordProgression={(settings) => {
            if (!activeWorkspaceId) {
              return;
            }

            const groups = createChordProgressionGroups(settings);

            if (settings.replaceWorkspace) {
              replaceMusicGroups(activeWorkspaceId, groups);
              return;
            }

            addMusicGroups(activeWorkspaceId, groups);
          }}
          onClose={closeAddDialog}
        />
      </Dialog>
    </>
  );
}
