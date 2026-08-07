"use client";

import {
  stringInstruments,
  stringInstrumentTunings,
  type OpenStringMidiNotes,
  type StringInstrumentKey,
} from "@musodojo/music-theory-data";
import { Copy, Pencil, Plus, SlidersVertical, Trash2 } from "lucide-react";
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
  DisclosureListChoice,
  DisclosureListConfirmAction,
  DisclosureListGroup,
  DisclosureListItem,
} from "@/components/ui/disclosure-list/DisclosureList";
import { SelectableOverflowRow } from "@/components/ui/selectable-overflow-row";
import { useAppStore } from "@/stores/appStore";
import { type SavedFretboardTuning } from "@/types/custom-fretboard-tuning";
import {
  formatCustomOpenStringNotes,
  savedTuningNameIsAvailable,
  tuningNotesAreEqual,
} from "@/utils/fretboard/customFretboardTunings";
import { fretboardInstrumentGroups } from "@/components/instrument-creation/options";
import { DISPLAY_VALUE_SEPARATOR } from "@/utils/valueSummary";
import { CustomTuningEditor } from "./CustomTuningEditor";

interface SelectedCustomTuning {
  name?: string;
  openMidiNotes: readonly number[];
}

interface CustomTuningsDialogBaseProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CustomTuningsChooseDialogProps extends CustomTuningsDialogBaseProps {
  instrument: StringInstrumentKey;
  mode: "choose";
  onSelect: (tuning: SavedFretboardTuning) => void;
  seedOpenMidiNotes: readonly number[];
  selected?: SelectedCustomTuning;
}

interface CustomTuningsManageDialogProps extends CustomTuningsDialogBaseProps {
  instrument?: never;
  mode: "manage";
  onSelect?: never;
  seedOpenMidiNotes?: never;
  selected?: never;
}

type CustomTuningsDialogProps =
  CustomTuningsChooseDialogProps | CustomTuningsManageDialogProps;

function getDefaultOpenMidiNotes(instrument: StringInstrumentKey) {
  return stringInstrumentTunings[stringInstruments[instrument].defaultTuning]
    .openMidiNotes;
}

export function CustomTuningsDialog({
  instrument,
  isOpen,
  mode,
  onClose,
  onSelect,
  seedOpenMidiNotes,
  selected,
}: CustomTuningsDialogProps) {
  const allTunings = useAppStore(
    (state) => state.dojoSettings.customFretboardTunings,
  );
  const addTuning = useAppStore((state) => state.addCustomFretboardTuning);
  const cloneTuning = useAppStore((state) => state.cloneCustomFretboardTuning);
  const updateTuning = useAppStore(
    (state) => state.updateCustomFretboardTuning,
  );
  const removeTuning = useAppStore(
    (state) => state.removeCustomFretboardTuning,
  );
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newEditorVersion, setNewEditorVersion] = useState(0);
  const [newTuningInstrument, setNewTuningInstrument] =
    useState<StringInstrumentKey>("guitar");
  const [isNewInstrumentOpen, setIsNewInstrumentOpen] = useState(false);
  const [openTuningId, setOpenTuningId] = useState<string | null>(null);
  const [editTuningId, setEditTuningId] = useState<string | null>(null);
  const [deleteTuningId, setDeleteTuningId] = useState<string | null>(null);
  const tunings = useMemo(
    () =>
      (allTunings ?? [])
        .filter(
          (tuning) => mode === "manage" || tuning.instrument === instrument,
        )
        .sort((left, right) => {
          if (mode === "manage") {
            const instrumentOrder = stringInstruments[
              left.instrument
            ].primaryName.localeCompare(
              stringInstruments[right.instrument].primaryName,
            );

            if (instrumentOrder !== 0) {
              return instrumentOrder;
            }
          }

          return left.name.localeCompare(right.name);
        }),
    [allTunings, instrument, mode],
  );
  const creationInstrument =
    mode === "choose" ? (instrument ?? "guitar") : newTuningInstrument;
  const creationOpenMidiNotes =
    mode === "choose" && seedOpenMidiNotes
      ? seedOpenMidiNotes
      : getDefaultOpenMidiNotes(creationInstrument);

  const closeRowEditors = () => {
    setEditTuningId(null);
    setDeleteTuningId(null);
  };

  const handleNewToggle = () => {
    setIsNewOpen((current) => !current);
    setOpenTuningId(null);
    setIsNewInstrumentOpen(false);
    closeRowEditors();
  };

  const handleCreate = (openMidiNotes: OpenStringMidiNotes, name?: string) => {
    if (!name) {
      return;
    }

    const input = { instrument: creationInstrument, name, openMidiNotes };
    const id = addTuning(input);

    if (!id) {
      return;
    }

    setIsNewOpen(false);
    setNewEditorVersion((version) => version + 1);

    if (mode === "choose") {
      onSelect?.({ id, ...input });
      onClose();
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} size="standard">
      <DialogHeader
        icon={<SlidersVertical />}
        title="My Tunings"
        onClose={onClose}
      />
      <DialogContent menuRhythm="standard">
        <DialogContentSection
          ariaLabel={
            mode === "choose"
              ? "Custom tuning choices"
              : "Manage custom tunings"
          }
        >
          <DisclosureList grouped groupGap="section">
            <DisclosureListGroup>
              <DisclosureListActionItem
                ariaLabel={`Create a custom tuning using the ${stringInstruments[creationInstrument].primaryName} instrument template`}
                icon={<Plus />}
                isOpen={isNewOpen}
                keepMounted
                label="New Tuning"
                preview={`Using ${stringInstruments[creationInstrument].primaryName} as Template`}
                onToggle={handleNewToggle}
              >
                {mode === "manage" ? (
                  <DisclosureList grouped>
                    <DisclosureListGroup>
                      <DisclosureListItem
                        ariaLabel={`Choose instrument template. Current: ${stringInstruments[newTuningInstrument].primaryName}`}
                        isOpen={isNewInstrumentOpen}
                        label="Instrument Template"
                        preview={
                          stringInstruments[newTuningInstrument].primaryName
                        }
                        onToggle={() =>
                          setIsNewInstrumentOpen((current) => !current)
                        }
                      >
                        <DisclosureList grouped>
                          {fretboardInstrumentGroups.map((group) => (
                            <DisclosureListGroup key={group.title}>
                              {group.options.map((option) => (
                                <DisclosureListChoice
                                  key={option.id}
                                  label={option.title}
                                  selected={newTuningInstrument === option.id}
                                  onClick={() => {
                                    setNewTuningInstrument(option.id);
                                    setIsNewInstrumentOpen(false);
                                  }}
                                />
                              ))}
                            </DisclosureListGroup>
                          ))}
                        </DisclosureList>
                      </DisclosureListItem>
                    </DisclosureListGroup>
                  </DisclosureList>
                ) : null}
                <CustomTuningEditor
                  key={`${creationInstrument}-${newEditorVersion}-${creationOpenMidiNotes.join("-")}`}
                  initialOpenMidiNotes={creationOpenMidiNotes}
                  isNameAvailable={(name) =>
                    savedTuningNameIsAvailable(
                      allTunings ?? [],
                      creationInstrument,
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
                    mode === "choose" &&
                    selected?.name === tuning.name &&
                    tuningNotesAreEqual(
                      selected.openMidiNotes,
                      tuning.openMidiNotes,
                    );
                  const isActionsOpen = openTuningId === tuning.id;
                  const toggleActions = () => {
                    setOpenTuningId((current) =>
                      current === tuning.id ? null : tuning.id,
                    );
                    setIsNewOpen(false);
                    closeRowEditors();
                  };

                  return (
                    <SelectableOverflowRow
                      key={tuning.id}
                      actionsLabel={`${isActionsOpen ? "Close" : "Open"} actions for ${tuning.name}`}
                      isActionsOpen={isActionsOpen}
                      label={tuning.name}
                      selected={isSelected}
                      selectAriaLabel={
                        mode === "choose"
                          ? `Use ${tuning.name} tuning`
                          : `Manage ${tuning.name} tuning`
                      }
                      selectedAriaLabel={`Current tuning: ${tuning.name}`}
                      subtitle={`${
                        mode === "manage"
                          ? `${stringInstruments[tuning.instrument].primaryName}${DISPLAY_VALUE_SEPARATOR}`
                          : ""
                      }${formatCustomOpenStringNotes(tuning.openMidiNotes)}`}
                      onSelect={() => {
                        if (mode === "manage") {
                          toggleActions();
                          return;
                        }

                        onSelect?.(tuning);
                        setIsNewOpen(false);
                        setOpenTuningId(null);
                        closeRowEditors();
                        onClose();
                      }}
                      onToggleActions={toggleActions}
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
                                  tuning.instrument,
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
                                  instrument: tuning.instrument,
                                  name,
                                  openMidiNotes,
                                });
                                setEditTuningId(null);
                              }}
                            />
                          </DisclosureListActionItem>
                        </DisclosureListGroup>

                        <DisclosureListGroup>
                          <DisclosureListAction
                            aria-label={`Duplicate ${tuning.name} tuning`}
                            icon={<Copy />}
                            label="Duplicate"
                            preventConcurrentClicks
                            onClick={() => {
                              cloneTuning(tuning.id);
                              setOpenTuningId(null);
                              closeRowEditors();
                            }}
                          />
                          <DisclosureListConfirmAction
                            actionAriaLabel={`Delete ${tuning.name} tuning`}
                            confirmAriaLabel={`Confirm deleting ${tuning.name}. This cannot be undone.`}
                            confirmButtonLabel="Delete"
                            confirmLabel={`Delete ${tuning.name}?`}
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
      <DialogCloseFooter onClose={onClose} />
    </Dialog>
  );
}
