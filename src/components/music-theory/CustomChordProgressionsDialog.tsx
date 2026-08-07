"use client";

import { type ChordProgression } from "@musodojo/music-theory-data";
import { Copy, List, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogContentSection,
  DialogCloseFooter,
  DialogHeader,
} from "@/components/ui/dialog/Dialog";
import {
  DisclosureList,
  DisclosureListAction,
  DisclosureListActionItem,
  DisclosureListConfirmAction,
  DisclosureListGroup,
} from "@/components/ui/disclosure-list/DisclosureList";
import { SelectableOverflowRow } from "@/components/ui/selectable-overflow-row";
import { useAppStore } from "@/stores/appStore";
import { type SavedChordProgression } from "@/types/custom-chord-progression";
import {
  CHORD_PROGRESSION_BAR_SEPARATOR,
  getChordProgressionRomanBarLabels,
} from "@/utils/music-theory/chordProgressions";
import { savedChordProgressionNameIsAvailable } from "@/utils/music-theory/customChordProgressions";
import { CustomChordProgressionEditor } from "./CustomChordProgressionEditor";
import styles from "./CustomChordProgressionsDialog.module.css";

interface CustomChordProgressionsDialogBaseProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CustomChordProgressionsChooseDialogProps extends CustomChordProgressionsDialogBaseProps {
  mode: "choose";
  selectedId?: string;
  onDeleteSelected: () => void;
  onSelect: (progression: SavedChordProgression) => void;
}

interface CustomChordProgressionsManageDialogProps extends CustomChordProgressionsDialogBaseProps {
  mode: "manage";
  selectedId?: never;
  onDeleteSelected?: never;
  onSelect?: never;
}

type CustomChordProgressionsDialogProps =
  | CustomChordProgressionsChooseDialogProps
  | CustomChordProgressionsManageDialogProps;

function formatProgressionSummary(progression: ChordProgression) {
  return getChordProgressionRomanBarLabels(progression).join(
    CHORD_PROGRESSION_BAR_SEPARATOR,
  );
}

export function CustomChordProgressionsDialog({
  isOpen,
  mode,
  selectedId,
  onClose,
  onDeleteSelected,
  onSelect,
}: CustomChordProgressionsDialogProps) {
  const allProgressions = useAppStore(
    (state) => state.dojoSettings.customChordProgressions,
  );
  const addProgression = useAppStore(
    (state) => state.addCustomChordProgression,
  );
  const cloneProgression = useAppStore(
    (state) => state.cloneCustomChordProgression,
  );
  const updateProgression = useAppStore(
    (state) => state.updateCustomChordProgression,
  );
  const removeProgression = useAppStore(
    (state) => state.removeCustomChordProgression,
  );
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newEditorVersion, setNewEditorVersion] = useState(0);
  const [openProgressionId, setOpenProgressionId] = useState<string | null>(
    null,
  );
  const [editProgressionId, setEditProgressionId] = useState<string | null>(
    null,
  );
  const [deleteProgressionId, setDeleteProgressionId] = useState<string | null>(
    null,
  );
  const progressions = useMemo(
    () =>
      [...(allProgressions ?? [])].sort((left, right) =>
        left.name.localeCompare(right.name),
      ),
    [allProgressions],
  );

  const closeRowEditors = () => {
    setEditProgressionId(null);
    setDeleteProgressionId(null);
  };

  const handleCreate = (name: string, progression: ChordProgression) => {
    const id = addProgression({ name, progression });
    if (!id) return false;

    setIsNewOpen(false);
    setNewEditorVersion((version) => version + 1);

    if (mode === "choose") {
      onSelect?.({ id, name, progression });
      onClose();
    }

    return true;
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} size="wide">
      <DialogHeader icon={<List />} title="My Progressions" onClose={onClose} />
      <DialogContent menuRhythm="standard">
        <DialogContentSection
          ariaLabel={
            mode === "choose"
              ? "Custom progression choices"
              : "Manage custom progressions"
          }
        >
          <DisclosureList grouped groupGap="section">
            <DisclosureListGroup>
              <DisclosureListActionItem
                ariaLabel="Create a custom progression"
                icon={<Plus />}
                isOpen={isNewOpen}
                keepMounted
                label="New Progression"
                onToggle={() => {
                  setIsNewOpen((current) => !current);
                  setOpenProgressionId(null);
                  closeRowEditors();
                }}
              >
                <CustomChordProgressionEditor
                  key={`new-${newEditorVersion}`}
                  isNameAvailable={(name) =>
                    savedChordProgressionNameIsAvailable(
                      allProgressions ?? [],
                      name,
                    )
                  }
                  onSave={handleCreate}
                />
              </DisclosureListActionItem>
            </DisclosureListGroup>

            {progressions.length > 0 ? (
              <DisclosureListGroup aria-label="Saved custom progressions">
                {progressions.map((progression) => {
                  const selected =
                    mode === "choose" && selectedId === progression.id;
                  const isActionsOpen = openProgressionId === progression.id;
                  const toggleActions = () => {
                    setOpenProgressionId((current) =>
                      current === progression.id ? null : progression.id,
                    );
                    setIsNewOpen(false);
                    closeRowEditors();
                  };

                  return (
                    <SelectableOverflowRow
                      key={progression.id}
                      actionsLabel={`${isActionsOpen ? "Close" : "Open"} actions for ${progression.name}`}
                      isActionsOpen={isActionsOpen}
                      label={progression.name}
                      selected={selected}
                      selectAriaLabel={
                        mode === "choose"
                          ? `Use ${progression.name}`
                          : `Manage ${progression.name}`
                      }
                      selectedAriaLabel={`Current progression: ${progression.name}`}
                      subtitle={
                        <span className={styles.summary}>
                          {formatProgressionSummary(progression.progression)}
                        </span>
                      }
                      onSelect={() => {
                        if (mode === "manage") {
                          toggleActions();
                          return;
                        }

                        onSelect?.(progression);
                        setOpenProgressionId(null);
                        closeRowEditors();
                        onClose();
                      }}
                      onToggleActions={toggleActions}
                    >
                      <DisclosureList grouped groupGap="section">
                        <DisclosureListGroup>
                          <DisclosureListActionItem
                            ariaLabel={`Edit ${progression.name}`}
                            icon={<Pencil />}
                            isOpen={editProgressionId === progression.id}
                            label="Edit"
                            onToggle={() => {
                              setEditProgressionId((current) =>
                                current === progression.id
                                  ? null
                                  : progression.id,
                              );
                              setDeleteProgressionId(null);
                            }}
                          >
                            <CustomChordProgressionEditor
                              key={`${progression.id}-${progression.name}`}
                              initialName={progression.name}
                              initialProgression={progression.progression}
                              isNameAvailable={(name) =>
                                savedChordProgressionNameIsAvailable(
                                  allProgressions ?? [],
                                  name,
                                  progression.id,
                                )
                              }
                              onSave={(name, nextProgression) => {
                                const wasUpdated = updateProgression(
                                  progression.id,
                                  {
                                    name,
                                    progression: nextProgression,
                                  },
                                );

                                if (!wasUpdated) {
                                  return false;
                                }

                                setEditProgressionId(null);
                                return true;
                              }}
                            />
                          </DisclosureListActionItem>
                        </DisclosureListGroup>
                        <DisclosureListGroup>
                          <DisclosureListAction
                            aria-label={`Duplicate ${progression.name}`}
                            icon={<Copy />}
                            label="Duplicate"
                            preventConcurrentClicks
                            onClick={() => {
                              cloneProgression(progression.id);
                              setOpenProgressionId(null);
                              closeRowEditors();
                            }}
                          />
                          <DisclosureListConfirmAction
                            actionAriaLabel={`Delete ${progression.name}`}
                            confirmAriaLabel={`Confirm deleting ${progression.name}. This cannot be undone.`}
                            confirmButtonLabel="Delete"
                            confirmLabel={`Delete ${progression.name}?`}
                            icon={<Trash2 />}
                            isConfirming={
                              deleteProgressionId === progression.id
                            }
                            label="Delete"
                            tone="danger"
                            onCancel={() => setDeleteProgressionId(null)}
                            onConfirm={() => {
                              removeProgression(progression.id);
                              if (selected) onDeleteSelected?.();
                              setOpenProgressionId(null);
                              closeRowEditors();
                            }}
                            onRequestConfirm={() => {
                              setDeleteProgressionId(progression.id);
                              setEditProgressionId(null);
                            }}
                          />
                        </DisclosureListGroup>
                      </DisclosureList>
                    </SelectableOverflowRow>
                  );
                })}
              </DisclosureListGroup>
            ) : null}
          </DisclosureList>
        </DialogContentSection>
      </DialogContent>
      <DialogCloseFooter onClose={onClose} />
    </Dialog>
  );
}
