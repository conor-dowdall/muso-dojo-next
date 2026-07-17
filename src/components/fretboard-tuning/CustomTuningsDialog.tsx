"use client";

import {
  type OpenStringMidiNotes,
  type StringInstrumentKey,
} from "@musodojo/music-theory-data";
import { ListChevronsUpDown, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogContentSection,
  DialogDoneFooter,
  DialogHeader,
} from "@/components/ui/dialog/Dialog";
import {
  DisclosureList,
  DisclosureListActionItem,
  DisclosureListConfirmAction,
  DisclosureListGroup,
} from "@/components/ui/disclosure-list/DisclosureList";
import { SelectableOverflowRow } from "@/components/ui/selectable-overflow-row";
import { useAppStore } from "@/stores/appStore";
import { type SavedFretboardTuning } from "@/types/custom-fretboard-tuning";
import {
  formatCustomOpenStringNotes,
  savedTuningNameIsAvailable,
  tuningNotesAreEqual,
} from "@/utils/fretboard/customFretboardTunings";
import { CustomTuningEditor } from "./CustomTuningEditor";

interface SelectedCustomTuning {
  name?: string;
  openMidiNotes: readonly number[];
}

interface CustomTuningsDialogProps {
  instrument: StringInstrumentKey;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (tuning: SavedFretboardTuning) => void;
  seedOpenMidiNotes: readonly number[];
  selected?: SelectedCustomTuning;
}

export function CustomTuningsDialog({
  instrument,
  isOpen,
  onClose,
  onSelect,
  seedOpenMidiNotes,
  selected,
}: CustomTuningsDialogProps) {
  const allTunings = useAppStore(
    (state) => state.dojoSettings.customFretboardTunings,
  );
  const addTuning = useAppStore((state) => state.addCustomFretboardTuning);
  const updateTuning = useAppStore(
    (state) => state.updateCustomFretboardTuning,
  );
  const removeTuning = useAppStore(
    (state) => state.removeCustomFretboardTuning,
  );
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newEditorVersion, setNewEditorVersion] = useState(0);
  const [openTuningId, setOpenTuningId] = useState<string | null>(null);
  const [editTuningId, setEditTuningId] = useState<string | null>(null);
  const [deleteTuningId, setDeleteTuningId] = useState<string | null>(null);
  const tunings = useMemo(
    () =>
      (allTunings ?? [])
        .filter((tuning) => tuning.instrument === instrument)
        .sort((left, right) => left.name.localeCompare(right.name)),
    [allTunings, instrument],
  );

  const closeRowEditors = () => {
    setEditTuningId(null);
    setDeleteTuningId(null);
  };

  const handleNewToggle = () => {
    setIsNewOpen((current) => !current);
    setOpenTuningId(null);
    closeRowEditors();
  };

  const handleCreate = (openMidiNotes: OpenStringMidiNotes, name?: string) => {
    if (!name) {
      return;
    }

    const input = { instrument, name, openMidiNotes };
    const id = addTuning(input);

    if (!id) {
      return;
    }

    onSelect({ id, ...input });
    setIsNewOpen(false);
    setNewEditorVersion((version) => version + 1);
    onClose();
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} size="standard">
      <DialogHeader
        icon={<ListChevronsUpDown />}
        title="Custom Tunings"
        onClose={onClose}
      />
      <DialogContent menuRhythm="standard">
        <DialogContentSection ariaLabel="Custom tuning choices">
          <DisclosureList grouped groupGap="section">
            <DisclosureListGroup>
              <DisclosureListActionItem
                ariaLabel="Create a custom tuning"
                icon={<Plus />}
                isOpen={isNewOpen}
                keepMounted
                label="New Tuning"
                onToggle={handleNewToggle}
              >
                <CustomTuningEditor
                  key={`${instrument}-${newEditorVersion}-${seedOpenMidiNotes.join("-")}`}
                  initialOpenMidiNotes={seedOpenMidiNotes}
                  isNameAvailable={(name) =>
                    savedTuningNameIsAvailable(
                      allTunings ?? [],
                      instrument,
                      name,
                    )
                  }
                  showNameField
                  onSave={handleCreate}
                />
              </DisclosureListActionItem>
            </DisclosureListGroup>

            {tunings.length > 0 ? (
              <DisclosureListGroup aria-label="Saved custom tunings">
                {tunings.map((tuning) => {
                  const isSelected =
                    selected?.name === tuning.name &&
                    tuningNotesAreEqual(
                      selected.openMidiNotes,
                      tuning.openMidiNotes,
                    );
                  const isActionsOpen = openTuningId === tuning.id;

                  return (
                    <SelectableOverflowRow
                      key={tuning.id}
                      actionsLabel={`${isActionsOpen ? "Close" : "Open"} actions for ${tuning.name}`}
                      isActionsOpen={isActionsOpen}
                      label={tuning.name}
                      selected={isSelected}
                      selectAriaLabel={`Use ${tuning.name} tuning`}
                      selectedAriaLabel={`Current tuning: ${tuning.name}`}
                      subtitle={formatCustomOpenStringNotes(
                        tuning.openMidiNotes,
                      )}
                      onSelect={() => {
                        onSelect(tuning);
                        setIsNewOpen(false);
                        setOpenTuningId(null);
                        closeRowEditors();
                        onClose();
                      }}
                      onToggleActions={() => {
                        setOpenTuningId((current) =>
                          current === tuning.id ? null : tuning.id,
                        );
                        setIsNewOpen(false);
                        closeRowEditors();
                      }}
                    >
                      <DisclosureList grouped groupGap="section">
                        <DisclosureListGroup>
                          <DisclosureListActionItem
                            ariaLabel={`Edit ${tuning.name}`}
                            icon={<Pencil />}
                            isOpen={editTuningId === tuning.id}
                            keepMounted
                            label="Edit"
                            onToggle={() => {
                              setEditTuningId((current) =>
                                current === tuning.id ? null : tuning.id,
                              );
                              setDeleteTuningId(null);
                            }}
                          >
                            <CustomTuningEditor
                              key={`${tuning.id}-${tuning.name}-${tuning.openMidiNotes.join("-")}`}
                              initialName={tuning.name}
                              initialOpenMidiNotes={tuning.openMidiNotes}
                              isNameAvailable={(name) =>
                                savedTuningNameIsAvailable(
                                  allTunings ?? [],
                                  instrument,
                                  name,
                                  tuning.id,
                                )
                              }
                              showNameField
                              onSave={(openMidiNotes, name) => {
                                if (!name) {
                                  return;
                                }

                                updateTuning(tuning.id, {
                                  instrument,
                                  name,
                                  openMidiNotes,
                                });
                                setEditTuningId(null);
                              }}
                            />
                          </DisclosureListActionItem>
                        </DisclosureListGroup>

                        <DisclosureListGroup>
                          <DisclosureListConfirmAction
                            actionAriaLabel={`Delete ${tuning.name} tuning`}
                            confirmAriaLabel={`Confirm deleting ${tuning.name}. Existing Fretboards will keep their tuning.`}
                            confirmButtonLabel="Delete"
                            confirmLabel={`Delete ${tuning.name}? Existing Fretboards will not change.`}
                            icon={<Trash2 />}
                            isConfirming={deleteTuningId === tuning.id}
                            label="Delete"
                            tone="danger"
                            onCancel={() => setDeleteTuningId(null)}
                            onConfirm={() => {
                              removeTuning(tuning.id);
                              setOpenTuningId(null);
                              closeRowEditors();
                            }}
                            onRequestConfirm={() => {
                              setDeleteTuningId(tuning.id);
                              setEditTuningId(null);
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
      <DialogDoneFooter onDone={onClose} />
    </Dialog>
  );
}
