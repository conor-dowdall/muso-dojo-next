"use client";

import { type SyntheticEvent, useId, useState } from "react";
import { Check, Copy, Plus, Trash2 } from "lucide-react";
import { DialogContent, DialogHeader } from "@/components/ui/dialog/Dialog";
import { Button } from "@/components/ui/buttons/Button";
import { IconButton } from "@/components/ui/buttons/IconButton";
import { OptionButton } from "@/components/ui/buttons/OptionButton";
import { Text } from "@/components/ui/typography/Text";
import { useAppStore } from "@/stores/appStore";
import { type MusicGroupConfig } from "@/types/workspace";
import {
  normalizeRootNoteString,
  noteCollections,
} from "@musodojo/music-theory-data";
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

const maxWorkspaceSignaturePreviewCount = 2;

function getSignatureJoiner({
  category,
}: (typeof noteCollections)[keyof typeof noteCollections]) {
  return category === "chord" ? "" : " ";
}

function getGroupSignatureLabel(group: MusicGroupConfig) {
  const rootNoteLabel =
    normalizeRootNoteString(group.rootNote) ?? group.rootNote;
  const collection = noteCollections[group.noteCollectionKey];
  const collectionName = collection.primaryName;
  const joiner = getSignatureJoiner(collection);

  return `${rootNoteLabel}${joiner}${collectionName}`;
}

function getWorkspaceSubtitle(groups: MusicGroupConfig[]) {
  if (groups.length === 0) {
    return "No groups yet";
  }

  const signatureCounts = new Map<string, number>();

  groups.forEach((group) => {
    const signature = getGroupSignatureLabel(group);
    signatureCounts.set(signature, (signatureCounts.get(signature) ?? 0) + 1);
  });

  const signatures = Array.from(signatureCounts.entries()).map(
    ([signature, count]) =>
      count === 1 ? signature : `${signature} x${count}`,
  );
  const previewSignatures = signatures.slice(
    0,
    maxWorkspaceSignaturePreviewCount,
  );
  const remainingSignatureCount = signatures.length - previewSignatures.length;
  const moreSignaturesLabel =
    remainingSignatureCount > 0 ? ` + ${remainingSignatureCount} more` : "";

  return `${getGroupCountLabel(groups.length)} - ${previewSignatures.join(
    ", ",
  )}${moreSignaturesLabel}`;
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
  const activeWorkspace =
    (activeWorkspaceId ? workspaces[activeWorkspaceId] : undefined) ??
    workspaceList[0];
  const activeWorkspaceName = activeWorkspace?.name ?? "Practice Workspace";
  const [draftWorkspace, setDraftWorkspace] = useState({
    id: activeWorkspace?.id ?? "",
    savedName: activeWorkspaceName,
    name: activeWorkspaceName,
  });
  const [deleteConfirmationWorkspaceId, setDeleteConfirmationWorkspaceId] =
    useState<string | null>(null);

  const handleAddWorkspace = () => {
    addWorkspace();
  };

  const setDraftName = (name: string) => {
    if (!activeWorkspace) {
      return;
    }

    setDraftWorkspace({
      id: activeWorkspace.id,
      savedName: activeWorkspace.name,
      name,
    });
  };

  const draftWorkspaceMatchesActive =
    activeWorkspace !== undefined &&
    draftWorkspace.id === activeWorkspace.id &&
    draftWorkspace.savedName === activeWorkspace.name;
  const draftName = draftWorkspaceMatchesActive
    ? draftWorkspace.name
    : (activeWorkspace?.name ?? "");
  const trimmedDraftName = draftName.trim();
  const hasNameChanged = trimmedDraftName !== activeWorkspace?.name;
  const isNameEmpty = trimmedDraftName.length === 0;
  const hasNameConflict = workspaceList.some(
    (workspace) =>
      workspace.id !== activeWorkspace?.id &&
      normalizeNameForComparison(workspace.name) ===
        normalizeNameForComparison(trimmedDraftName),
  );
  const canRename =
    activeWorkspace !== undefined &&
    hasNameChanged &&
    !isNameEmpty &&
    !hasNameConflict;
  const isConfirmingDelete =
    activeWorkspace !== undefined &&
    deleteConfirmationWorkspaceId === activeWorkspace.id;
  const renameMessage = isNameEmpty
    ? "Add a name before saving."
    : hasNameConflict
      ? "That workspace name is already in use."
      : "";

  const handleRename = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!activeWorkspace || !canRename) {
      return;
    }

    renameWorkspace(activeWorkspace.id, trimmedDraftName);
    setDraftWorkspace({
      id: activeWorkspace.id,
      savedName: trimmedDraftName,
      name: trimmedDraftName,
    });
  };

  const handleCloneWorkspace = () => {
    if (!activeWorkspace) {
      return;
    }

    cloneWorkspace(activeWorkspace.id);
  };

  const handleDeleteWorkspace = () => {
    if (!activeWorkspace) {
      return;
    }

    removeWorkspace(activeWorkspace.id);
    setDeleteConfirmationWorkspaceId(null);
  };

  return (
    <>
      <DialogHeader title="Manage Workspaces" onClose={onClose} />
      <DialogContent className={styles.content}>
        <div className={styles.workspaceControls}>
          {activeWorkspace ? (
            <section className={styles.section} aria-label="Workspace name">
              <form className={styles.nameForm} onSubmit={handleRename}>
                <div className={styles.nameField}>
                  <label className={styles.nameLabel} htmlFor={nameInputId}>
                    Workspace name
                  </label>
                  <div className={styles.nameControl}>
                    <input
                      aria-describedby={
                        renameMessage ? nameMessageId : undefined
                      }
                      aria-invalid={isNameEmpty || hasNameConflict}
                      autoComplete="off"
                      className={styles.nameInput}
                      id={nameInputId}
                      spellCheck={false}
                      value={draftName}
                      onChange={(event) =>
                        setDraftName(event.currentTarget.value)
                      }
                    />
                    <IconButton
                      aria-label="Save workspace name"
                      disabled={!canRename}
                      icon={<Check />}
                      shouldYield={false}
                      type="submit"
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
          ) : null}

          <section className={styles.section} aria-label="Workspace actions">
            <div className={styles.actionGrid}>
              <OptionButton
                icon={<Plus />}
                label="New workspace"
                onClick={handleAddWorkspace}
              />
              <OptionButton
                icon={<Copy />}
                disabled={!activeWorkspace}
                label="Duplicate workspace"
                onClick={handleCloneWorkspace}
              />
            </div>
          </section>

          {activeWorkspace ? (
            <section
              className={`${styles.section} ${styles.dangerSection}`}
              aria-label="Delete workspace"
            >
              {isConfirmingDelete ? (
                <div
                  aria-label={`Confirm deleting ${activeWorkspace.name}. This cannot be undone.`}
                  className={styles.deleteConfirmation}
                  role="group"
                >
                  <Text
                    as="span"
                    className={styles.deletePrompt}
                    size="sm"
                    variant="muted"
                  >
                    Delete {activeWorkspace.name}?
                  </Text>
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
                      onClick={handleDeleteWorkspace}
                    />
                  </div>
                </div>
              ) : (
                <Button
                  className={styles.deleteButton}
                  icon={<Trash2 />}
                  label="Delete workspace"
                  size="sm"
                  tone="danger"
                  onClick={() =>
                    setDeleteConfirmationWorkspaceId(activeWorkspace.id)
                  }
                />
              )}
            </section>
          ) : null}
        </div>

        <section className={styles.section} aria-label="Workspaces">
          <div className={styles.workspaceList}>
            {workspaceList.length === 0 ? (
              <Text as="p" size="sm" variant="muted">
                No workspaces
              </Text>
            ) : (
              workspaceList.map((workspace) => {
                const isActive = workspace.id === activeWorkspace.id;

                return (
                  <OptionButton
                    key={workspace.id}
                    aria-current={isActive ? "true" : undefined}
                    presentation="list"
                    selected={isActive}
                    label={workspace.name}
                    preview={getWorkspaceSubtitle(workspace.groups)}
                    onClick={() => {
                      setActiveWorkspaceId(workspace.id);
                      setDeleteConfirmationWorkspaceId(null);
                    }}
                  />
                );
              })
            )}
          </div>
        </section>
      </DialogContent>
    </>
  );
}
