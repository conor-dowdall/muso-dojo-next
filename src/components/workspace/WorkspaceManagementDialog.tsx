"use client";

import { Fragment, type SyntheticEvent, useId, useState } from "react";
import { Check, Copy, Plus, Settings, Trash2 } from "lucide-react";
import { DialogContent, DialogHeader } from "@/components/ui/dialog/Dialog";
import { Button } from "@/components/ui/buttons/Button";
import { IconButton } from "@/components/ui/buttons/IconButton";
import { OptionButton } from "@/components/ui/buttons/OptionButton";
import { Text } from "@/components/ui/typography/Text";
import {
  DisclosureList,
  DisclosureListAction,
  DisclosureListGroup,
  DisclosureListItem,
  DisclosureListPanel,
  useDisclosureList,
} from "@/components/ui/disclosure-list/DisclosureList";
import { useAppStore } from "@/stores/appStore";
import { type MusicGroupConfig } from "@/types/workspace";
import { WorkspaceNoteColorSettings } from "./WorkspaceNoteColorSettings";
import {
  normalizeRootNoteString,
  noteCollections,
} from "@musodojo/music-theory-data";
import styles from "./WorkspaceManagementDialog.module.css";

interface WorkspaceManagementDialogProps {
  onClose: () => void;
}

type WorkspaceActionChoice = "settings";
type WorkspaceSettingChoice = "title" | "note-colors";

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
  const workspaceActionDisclosure = useDisclosureList<WorkspaceActionChoice>();
  const workspaceSettingDisclosure =
    useDisclosureList<WorkspaceSettingChoice>();
  const [deleteConfirmationWorkspaceId, setDeleteConfirmationWorkspaceId] =
    useState<string | null>(null);
  const activeWorkspaceId = useAppStore((state) => state.activeWorkspaceId);
  const workspaces = useAppStore((state) => state.workspaces);
  const setActiveWorkspaceId = useAppStore(
    (state) => state.setActiveWorkspaceId,
  );
  const addWorkspace = useAppStore((state) => state.addWorkspace);
  const cloneWorkspace = useAppStore((state) => state.cloneWorkspace);
  const removeWorkspace = useAppStore((state) => state.removeWorkspace);
  const renameWorkspace = useAppStore((state) => state.renameWorkspace);
  const setWorkspaceNoteColorConfig = useAppStore(
    (state) => state.setWorkspaceNoteColorConfig,
  );

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

  const handleAddWorkspace = () => {
    addWorkspace();
    setDeleteConfirmationWorkspaceId(null);
    workspaceActionDisclosure.closeAll();
    workspaceSettingDisclosure.closeAll();
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
    workspaceSettingDisclosure.closeChoice("title");
  };

  const handleCloneWorkspace = () => {
    if (!activeWorkspace) {
      return;
    }

    cloneWorkspace(activeWorkspace.id);
    setDeleteConfirmationWorkspaceId(null);
    workspaceActionDisclosure.closeAll();
    workspaceSettingDisclosure.closeAll();
  };

  const handleDeleteWorkspace = () => {
    if (!activeWorkspace) {
      return;
    }

    removeWorkspace(activeWorkspace.id);
    setDeleteConfirmationWorkspaceId(null);
    workspaceActionDisclosure.closeAll();
    workspaceSettingDisclosure.closeAll();
  };

  return (
    <>
      <DialogHeader title="Manage Workspaces" onClose={onClose} />
      <DialogContent className={styles.content}>
        <div className={styles.workspaceLayout}>
          <section
            className={styles.workspaceListSection}
            aria-label="Workspace choices"
          >
            <DisclosureList className={styles.workspaceList} grouped>
              <DisclosureListGroup>
                <DisclosureListAction
                  icon={<Plus />}
                  label="New Workspace"
                  onClick={handleAddWorkspace}
                />
              </DisclosureListGroup>

              <DisclosureListGroup>
                {workspaceList.length === 0 ? (
                  <Text as="p" size="sm" variant="muted">
                    No workspaces
                  </Text>
                ) : (
                  workspaceList.map((workspace) => {
                    const isActive = workspace.id === activeWorkspace?.id;

                    return (
                      <Fragment key={workspace.id}>
                        <OptionButton
                          aria-current={isActive ? "true" : undefined}
                          presentation="list"
                          selected={isActive}
                          label={workspace.name}
                          preview={getWorkspaceSubtitle(workspace.groups)}
                          onClick={() => {
                            setActiveWorkspaceId(workspace.id);
                            setDeleteConfirmationWorkspaceId(null);
                            workspaceSettingDisclosure.closeAll();
                          }}
                        />

                        {isActive ? (
                          <DisclosureListPanel
                            className={styles.workspaceActionsPanel}
                          >
                            <DisclosureList
                              className={styles.workspaceActionsList}
                              grouped
                            >
                              <DisclosureListGroup>
                                <DisclosureListAction
                                  icon={<Copy />}
                                  label="Duplicate"
                                  onClick={handleCloneWorkspace}
                                />

                                <DisclosureListItem
                                  ariaLabel={`Open settings for ${workspace.name}`}
                                  icon={<Settings />}
                                  isOpen={
                                    workspaceActionDisclosure.openChoice ===
                                    "settings"
                                  }
                                  keepMounted
                                  label="Settings"
                                  onToggle={() =>
                                    workspaceActionDisclosure.toggleChoice(
                                      "settings",
                                    )
                                  }
                                >
                                  <DisclosureList density="compact">
                                    <DisclosureListItem
                                      ariaLabel={`Edit workspace title. Current: ${workspace.name}`}
                                      isOpen={
                                        workspaceSettingDisclosure.openChoice ===
                                        "title"
                                      }
                                      keepMounted
                                      label="Title"
                                      preview={draftName}
                                      onToggle={() =>
                                        workspaceSettingDisclosure.toggleChoice(
                                          "title",
                                        )
                                      }
                                    >
                                      <form
                                        className={styles.nameForm}
                                        onSubmit={handleRename}
                                      >
                                        <div className={styles.nameField}>
                                          <label
                                            className={styles.nameLabel}
                                            htmlFor={nameInputId}
                                          >
                                            Workspace title
                                          </label>
                                          <div className={styles.nameControl}>
                                            <input
                                              aria-describedby={
                                                renameMessage
                                                  ? nameMessageId
                                                  : undefined
                                              }
                                              aria-invalid={
                                                isNameEmpty || hasNameConflict
                                              }
                                              autoComplete="off"
                                              className={styles.nameInput}
                                              id={nameInputId}
                                              spellCheck={false}
                                              value={draftName}
                                              onChange={(event) =>
                                                setDraftName(
                                                  event.currentTarget.value,
                                                )
                                              }
                                            />
                                            <IconButton
                                              aria-label="Save workspace name"
                                              disabled={!canRename}
                                              icon={<Check />}
                                              shouldYield={false}
                                              size="lg"
                                              type="submit"
                                            />
                                          </div>
                                          {renameMessage ? (
                                            <Text
                                              as="span"
                                              className={styles.nameMessage}
                                              data-tone={
                                                isNameEmpty || hasNameConflict
                                                  ? "danger"
                                                  : "muted"
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
                                    </DisclosureListItem>

                                    <WorkspaceNoteColorSettings
                                      isOpen={
                                        workspaceSettingDisclosure.openChoice ===
                                        "note-colors"
                                      }
                                      value={workspace.noteColorConfig}
                                      onClose={() =>
                                        workspaceSettingDisclosure.closeChoice(
                                          "note-colors",
                                        )
                                      }
                                      onToggle={() =>
                                        workspaceSettingDisclosure.toggleChoice(
                                          "note-colors",
                                        )
                                      }
                                      onChange={(noteColorConfig) =>
                                        setWorkspaceNoteColorConfig(
                                          workspace.id,
                                          noteColorConfig,
                                        )
                                      }
                                    />
                                  </DisclosureList>
                                </DisclosureListItem>
                              </DisclosureListGroup>

                              <DisclosureListGroup
                                className={styles.workspaceDangerGroup}
                              >
                                {deleteConfirmationWorkspaceId ===
                                workspace.id ? (
                                  <div
                                    aria-label={`Confirm deleting ${workspace.name}. This cannot be undone.`}
                                    className={styles.deleteInlineConfirmation}
                                    role="group"
                                  >
                                    <span className={styles.deleteInlineHeader}>
                                      <span
                                        className={styles.deleteInlineIcon}
                                        aria-hidden="true"
                                      >
                                        <Trash2 />
                                      </span>
                                      <Text
                                        as="span"
                                        className={styles.deletePrompt}
                                        size="sm"
                                        variant="muted"
                                      >
                                        Delete {workspace.name}?
                                      </Text>
                                    </span>
                                    <div
                                      className={
                                        styles.deleteConfirmationActions
                                      }
                                    >
                                      <Button
                                        label="Cancel"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() =>
                                          setDeleteConfirmationWorkspaceId(null)
                                        }
                                      />
                                      <Button
                                        aria-label={`Delete ${workspace.name}`}
                                        label="Delete"
                                        size="sm"
                                        tone="danger"
                                        onClick={handleDeleteWorkspace}
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <DisclosureListAction
                                    icon={<Trash2 />}
                                    label="Delete"
                                    tone="danger"
                                    onClick={() =>
                                      setDeleteConfirmationWorkspaceId(
                                        workspace.id,
                                      )
                                    }
                                  />
                                )}
                              </DisclosureListGroup>
                            </DisclosureList>
                          </DisclosureListPanel>
                        ) : null}
                      </Fragment>
                    );
                  })
                )}
              </DisclosureListGroup>
            </DisclosureList>
          </section>
        </div>
      </DialogContent>
    </>
  );
}
