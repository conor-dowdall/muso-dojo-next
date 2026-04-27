"use client";

import { type SyntheticEvent, useId, useState } from "react";
import { Check, Copy, Plus, Trash2 } from "lucide-react";
import { DialogContent, DialogHeader } from "@/components/ui/dialog/Dialog";
import { Button } from "@/components/ui/buttons/Button";
import { IconButton } from "@/components/ui/buttons/IconButton";
import { Heading } from "@/components/ui/typography/Heading";
import { OptionButton } from "@/components/ui/buttons/OptionButton";
import { Text } from "@/components/ui/typography/Text";
import { useAppStore } from "@/stores/appStore";
import styles from "./WorkspaceManagementDialog.module.css";

interface WorkspaceManagementDialogProps {
  onClose: () => void;
}

function normalizeNameForComparison(name: string) {
  return name.trim().toLocaleLowerCase();
}

function getGroupCountLabel(groupCount: number) {
  return groupCount === 1 ? "1 group" : `${groupCount} groups`;
}

export function WorkspaceManagementDialog({
  onClose,
}: WorkspaceManagementDialogProps) {
  const nameInputId = useId();
  const nameMessageId = useId();
  const activeWorkspaceId = useAppStore((state) => state.activeWorkspaceId);
  const workspaces = useAppStore((state) => state.workspaces);
  const setActiveWorkspaceId = useAppStore(
    (state) => state.setActiveWorkspaceId,
  );
  const addWorkspace = useAppStore((state) => state.addWorkspace);
  const cloneWorkspace = useAppStore((state) => state.cloneWorkspace);
  const removeWorkspace = useAppStore((state) => state.removeWorkspace);
  const renameWorkspace = useAppStore((state) => state.renameWorkspace);

  const workspaceList = Object.values(workspaces);
  const activeWorkspace = workspaces[activeWorkspaceId] ?? workspaceList[0];
  const activeWorkspaceName = activeWorkspace?.name ?? "Practice Workspace";
  const [draftWorkspace, setDraftWorkspace] = useState({
    id: activeWorkspace?.id ?? "",
    savedName: activeWorkspaceName,
    name: activeWorkspaceName,
  });
  const [deleteConfirmationWorkspaceId, setDeleteConfirmationWorkspaceId] =
    useState<string | null>(null);

  if (!activeWorkspace) {
    return (
      <>
        <DialogHeader title="Workspace" onClose={onClose} />
        <DialogContent>
          <Text as="p" variant="muted">
            No workspace is available.
          </Text>
        </DialogContent>
      </>
    );
  }

  const setDraftName = (name: string) => {
    setDraftWorkspace({
      id: activeWorkspace.id,
      savedName: activeWorkspace.name,
      name,
    });
  };

  const draftWorkspaceMatchesActive =
    draftWorkspace.id === activeWorkspace.id &&
    draftWorkspace.savedName === activeWorkspace.name;
  const draftName = draftWorkspaceMatchesActive
    ? draftWorkspace.name
    : activeWorkspace.name;
  const trimmedDraftName = draftName.trim();
  const hasNameChanged = trimmedDraftName !== activeWorkspace.name;
  const isNameEmpty = trimmedDraftName.length === 0;
  const hasNameConflict = workspaceList.some(
    (workspace) =>
      workspace.id !== activeWorkspace.id &&
      normalizeNameForComparison(workspace.name) ===
        normalizeNameForComparison(trimmedDraftName),
  );
  const canRename = hasNameChanged && !isNameEmpty && !hasNameConflict;
  const canDeleteWorkspace = workspaceList.length > 1;
  const isConfirmingDelete =
    deleteConfirmationWorkspaceId === activeWorkspace.id;
  const renameMessage = isNameEmpty
    ? "Add a name before saving."
    : hasNameConflict
      ? "That workspace name is already in use."
      : "";

  const handleRename = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canRename) {
      return;
    }

    renameWorkspace(activeWorkspace.id, trimmedDraftName);
    setDraftWorkspace({
      id: activeWorkspace.id,
      savedName: trimmedDraftName,
      name: trimmedDraftName,
    });
  };

  const handleAddWorkspace = () => {
    addWorkspace();
  };

  const handleCloneWorkspace = () => {
    cloneWorkspace(activeWorkspace.id);
  };

  const handleDeleteWorkspace = () => {
    if (!canDeleteWorkspace) {
      return;
    }

    removeWorkspace(activeWorkspace.id);
    setDeleteConfirmationWorkspaceId(null);
  };

  return (
    <>
      <DialogHeader title="Workspace" onClose={onClose} />
      <DialogContent className={styles.content}>
        <section className={styles.section} aria-labelledby="workspace-name">
          <div className={styles.sectionHeader}>
            <Heading as="h3" id="workspace-name" size="xs" variant="muted">
              Name
            </Heading>
          </div>

          <form className={styles.nameForm} onSubmit={handleRename}>
            <div className={styles.nameField}>
              <label className={styles.nameLabel} htmlFor={nameInputId}>
                Workspace name
              </label>
              <div className={styles.nameControl}>
                <input
                  aria-describedby={renameMessage ? nameMessageId : undefined}
                  aria-invalid={isNameEmpty || hasNameConflict}
                  autoComplete="off"
                  className={styles.nameInput}
                  id={nameInputId}
                  spellCheck={false}
                  value={draftName}
                  onChange={(event) => setDraftName(event.currentTarget.value)}
                />
                <IconButton
                  aria-label="Save workspace name"
                  disabled={!canRename}
                  icon={<Check />}
                  shouldYield={false}
                  type="submit"
                  variant="outline"
                />
              </div>
              {renameMessage ? (
                <Text
                  as="span"
                  className={styles.nameMessage}
                  data-tone={
                    isNameEmpty || hasNameConflict ? "danger" : "muted"
                  }
                  id={nameMessageId}
                  size="xs"
                  variant="muted"
                >
                  {renameMessage}
                </Text>
              ) : null}
            </div>
          </form>
        </section>

        <section className={styles.section} aria-labelledby="workspace-actions">
          <div className={styles.sectionHeader}>
            <Heading as="h3" id="workspace-actions" size="xs" variant="muted">
              Actions
            </Heading>
          </div>
          <div className={styles.actionGrid}>
            <OptionButton
              icon={<Plus />}
              label="New workspace"
              subtitle="Start fresh."
              onClick={handleAddWorkspace}
            />
            <OptionButton
              icon={<Copy />}
              label="Duplicate workspace"
              subtitle="Copy groups and instruments."
              onClick={handleCloneWorkspace}
            />
          </div>
        </section>

        <section className={styles.section} aria-labelledby="workspace-switch">
          <div className={styles.sectionHeader}>
            <Heading as="h3" id="workspace-switch" size="xs" variant="muted">
              Workspaces
            </Heading>
          </div>

          <div className={styles.workspaceList}>
            {workspaceList.map((workspace) => {
              const isActive = workspace.id === activeWorkspace.id;

              return (
                <OptionButton
                  key={workspace.id}
                  aria-current={isActive ? "true" : undefined}
                  presentation="list"
                  selected={isActive}
                  label={workspace.name}
                  subtitle={getGroupCountLabel(workspace.groups.length)}
                  onClick={() => {
                    setActiveWorkspaceId(workspace.id);
                    setDeleteConfirmationWorkspaceId(null);
                  }}
                />
              );
            })}
          </div>
        </section>

        <section
          className={`${styles.section} ${styles.dangerSection}`}
          aria-labelledby="workspace-delete"
        >
          <div className={styles.sectionHeader}>
            <Heading
              as="h3"
              className={styles.dangerHeading}
              id="workspace-delete"
              size="xs"
              variant="muted"
            >
              Delete
            </Heading>
          </div>

          {isConfirmingDelete ? (
            <div
              aria-label={`Confirm deleting ${activeWorkspace.name}. This cannot be undone.`}
              className={styles.deleteConfirmation}
              role="group"
            >
              <div className={styles.deleteConfirmationActions}>
                <Button
                  label="Cancel"
                  size="sm"
                  variant="ghost"
                  onClick={() => setDeleteConfirmationWorkspaceId(null)}
                />
                <Button
                  aria-label={`Delete ${activeWorkspace.name}`}
                  label="Delete"
                  size="sm"
                  tone="danger"
                  variant="outline"
                  onClick={handleDeleteWorkspace}
                />
              </div>
            </div>
          ) : (
            <>
              <Button
                className={styles.deleteButton}
                disabled={!canDeleteWorkspace}
                icon={<Trash2 />}
                label="Delete workspace"
                size="sm"
                tone="danger"
                variant="outline"
                onClick={() =>
                  setDeleteConfirmationWorkspaceId(activeWorkspace.id)
                }
              />
              {!canDeleteWorkspace && (
                <Text as="p" size="xs" variant="muted">
                  Keep at least one workspace.
                </Text>
              )}
            </>
          )}
        </section>
      </DialogContent>
    </>
  );
}
