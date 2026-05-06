"use client";

import { useState } from "react";
import {
  chordProgressions,
  normalizeRootNoteString,
  type ChordProgressionKey,
  type RootNote,
} from "@musodojo/music-theory-data";
import {
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog/Dialog";
import { Button } from "@/components/ui/buttons/Button";
import { CheckOptionButton } from "@/components/ui/buttons/CheckOptionButton";
import {
  DisclosureList,
  DisclosureListChoice,
  DisclosureListChoiceItem,
  DisclosureListGroup,
  DisclosureListItem,
  useDisclosureList,
} from "@/components/ui/disclosure-list/DisclosureList";
import {
  defaultFretboardInstrumentSelection,
  defaultKeyboardInstrumentSelection,
  getInstrumentCreationConfig,
  InstrumentCreationSettingsMenu,
  type FretboardInstrumentSelection,
  type KeyboardInstrumentSelection,
} from "@/components/music-group/InstrumentCreationSettingsMenu";
import { RootNoteGrid } from "@/components/music-group/RootNoteGrid";
import { type AddableMusicGroupItemType } from "@/components/music-group/addToMusicGroupOptions";
import { Text } from "@/components/ui/typography/Text";
import {
  chordProgressionLoopGroups,
  getChordProgressionDisplaySummary,
} from "@/utils/music-theory/chordProgressions";
import styles from "@/components/music-group/AddToMusicGroupDialog.module.css";
import localStyles from "./AddToWorkspaceDialog.module.css";
import { type InstrumentCreationConfig } from "@/types/workspace";

type WorkspaceAddMode = "blank-group" | "chord-progression";
type WorkspaceChoice = "key" | "progression";

interface AddToWorkspaceDialogProps {
  onAddBlankGroup: (settings: { replaceWorkspace: boolean }) => void;
  onAddChordProgression: (settings: {
    rootNote: RootNote;
    progressionKey: ChordProgressionKey;
    instrumentType: AddableMusicGroupItemType;
    instrumentSettings: InstrumentCreationConfig;
    replaceWorkspace: boolean;
  }) => void;
  onClose: () => void;
}

const workspaceAddOptions = [
  { id: "blank-group", title: "New Music Group" },
  { id: "chord-progression", title: "Progression Practice Set" },
] as const satisfies readonly { id: WorkspaceAddMode; title: string }[];

const defaultProgressionKey = "oneOneFiveFive" satisfies ChordProgressionKey;

function getProgressionLabels(
  rootNote: RootNote,
  progressionKey: ChordProgressionKey,
) {
  const summary = getChordProgressionDisplaySummary(rootNote, progressionKey);

  return {
    chordLabel: summary.chordNames.join(" | "),
    romanLabel: summary.romanNames.join(" | "),
  };
}

export function AddToWorkspaceDialog({
  onAddBlankGroup,
  onAddChordProgression,
  onClose,
}: AddToWorkspaceDialogProps) {
  const [selectedMode, setSelectedMode] =
    useState<WorkspaceAddMode>("blank-group");
  const [rootNote, setRootNote] = useState<RootNote>("C");
  const [progressionKey, setProgressionKey] = useState<ChordProgressionKey>(
    defaultProgressionKey,
  );
  const [replaceWorkspace, setReplaceWorkspace] = useState(false);
  const [instrumentType, setInstrumentType] =
    useState<AddableMusicGroupItemType>("keyboard");
  const workspaceDisclosure = useDisclosureList<WorkspaceChoice>();
  const [instrumentCloseSignal, setInstrumentCloseSignal] = useState(0);
  const [keyboardSelection, setKeyboardSelection] =
    useState<KeyboardInstrumentSelection>(defaultKeyboardInstrumentSelection);
  const [fretboardSelection, setFretboardSelection] =
    useState<FretboardInstrumentSelection>(defaultFretboardInstrumentSelection);

  const selectedRootNote = normalizeRootNoteString(rootNote) ?? "C";
  const selectedProgression = chordProgressions[progressionKey];
  const { chordLabel: progressionChordLabel, romanLabel: progressionRomanLabel } =
    getProgressionLabels(selectedRootNote, progressionKey);
  const shouldShowProgressionRomanSubtitle =
    selectedProgression.primaryName !== progressionRomanLabel;
  const actionLabel = replaceWorkspace
    ? "Replace Workspace"
    : selectedMode === "blank-group"
      ? "Add Group"
      : "Add Progression";

  const handleWorkspaceChoiceToggle = (choice: WorkspaceChoice) => {
    if (workspaceDisclosure.openChoice !== choice) {
      setInstrumentCloseSignal((currentSignal) => currentSignal + 1);
    }
    workspaceDisclosure.toggleChoice(choice);
  };

  const handleRootNoteSelect = (nextRootNote: RootNote) => {
    setRootNote(nextRootNote);
    workspaceDisclosure.closeChoice("key");
  };

  const handleSubmit = () => {
    if (selectedMode === "blank-group") {
      onAddBlankGroup({ replaceWorkspace });
      onClose();
      return;
    }

    onAddChordProgression({
      rootNote: selectedRootNote,
      progressionKey,
      instrumentType,
      replaceWorkspace,
      instrumentSettings: getInstrumentCreationConfig(
        instrumentType,
        keyboardSelection,
        fretboardSelection,
      ),
    });
    onClose();
  };

  return (
    <>
      <DialogHeader title="Add to Workspace" onClose={onClose} />
      <DialogContent className={styles.content}>
        <section className={styles.section} aria-label="Workspace item type">
          <DisclosureList>
            <DisclosureListChoice
              label={workspaceAddOptions[0].title}
              selected={selectedMode === "blank-group"}
              onClick={() => {
                setSelectedMode("blank-group");
                workspaceDisclosure.closeAll();
                setInstrumentCloseSignal((currentSignal) => currentSignal + 1);
              }}
            />
            <DisclosureListChoiceItem
              ariaLabel="Configure a progression practice set"
              isOpen={selectedMode === "chord-progression"}
              keepMounted
              label={workspaceAddOptions[1].title}
              selected={selectedMode === "chord-progression"}
              onToggle={() => {
                setSelectedMode("chord-progression");
              }}
            >
              <DisclosureList grouped groupGap="section">
                <DisclosureListGroup>
                  <DisclosureListItem
                    ariaLabel={`Choose key, ${selectedRootNote} selected`}
                    isOpen={workspaceDisclosure.openChoice === "key"}
                    keepMounted
                    label="Key"
                    panelVariant="menu"
                    preview={selectedRootNote}
                    onToggle={() => handleWorkspaceChoiceToggle("key")}
                  >
                    <div className={localStyles.rootPanel}>
                      <RootNoteGrid
                        value={rootNote}
                        onChange={handleRootNoteSelect}
                      />
                    </div>
                  </DisclosureListItem>

                  <DisclosureListItem
                    ariaLabel={`Choose chord progression, ${progressionRomanLabel} gives ${progressionChordLabel}`}
                    isOpen={workspaceDisclosure.openChoice === "progression"}
                    keepMounted
                    label={selectedProgression.primaryName}
                    panelVariant="menu"
                    preview={
                      <span
                        className={localStyles.progressionChordPreview}
                        title={progressionChordLabel}
                      >
                        {progressionChordLabel}
                      </span>
                    }
                    subtitle={
                      shouldShowProgressionRomanSubtitle ? (
                        <span
                          className={localStyles.progressionRomanPreview}
                          title={progressionRomanLabel}
                        >
                          {progressionRomanLabel}
                        </span>
                      ) : undefined
                    }
                    onToggle={() => handleWorkspaceChoiceToggle("progression")}
                  >
                    <DisclosureList grouped>
                      {chordProgressionLoopGroups.map((group) => (
                        <DisclosureListGroup key={group.key}>
                          <Text
                            as="p"
                            block
                            className={localStyles.progressionGroupLabel}
                            overline
                            size="xs"
                            variant="muted"
                          >
                            {group.title}
                          </Text>
                          {group.progressionKeys.map((candidateKey) => {
                            const candidate = chordProgressions[candidateKey];
                            const {
                              chordLabel: candidateChordLabel,
                              romanLabel: candidateRomanLabel,
                            } = getProgressionLabels(
                              selectedRootNote,
                              candidateKey,
                            );
                            const showCandidateRomanSubtitle =
                              candidate.primaryName !== candidateRomanLabel;

                            return (
                              <DisclosureListChoice
                                key={candidateKey}
                                label={candidate.primaryName}
                                preview={
                                  <span
                                    className={localStyles.progressionChordPreview}
                                    title={candidateChordLabel}
                                  >
                                    {candidateChordLabel}
                                  </span>
                                }
                                selected={progressionKey === candidateKey}
                                subtitle={
                                  showCandidateRomanSubtitle ? (
                                    <span
                                      className={
                                        localStyles.progressionRomanPreview
                                      }
                                      title={candidateRomanLabel}
                                    >
                                      {candidateRomanLabel}
                                    </span>
                                  ) : undefined
                                }
                                onClick={() => {
                                  setProgressionKey(candidateKey);
                                  workspaceDisclosure.closeChoice(
                                    "progression",
                                  );
                                }}
                              />
                            );
                          })}
                        </DisclosureListGroup>
                      ))}
                    </DisclosureList>
                  </DisclosureListItem>
                </DisclosureListGroup>

                <DisclosureListGroup>
                  <InstrumentCreationSettingsMenu
                    closeSignal={instrumentCloseSignal}
                    fretboardSelection={fretboardSelection}
                    instrumentType={instrumentType}
                    keyboardSelection={keyboardSelection}
                    onChoiceOpen={workspaceDisclosure.closeAll}
                    onFretboardSelectionChange={setFretboardSelection}
                    onInstrumentTypeChange={setInstrumentType}
                    onKeyboardSelectionChange={setKeyboardSelection}
                  />
                </DisclosureListGroup>
              </DisclosureList>
            </DisclosureListChoiceItem>
          </DisclosureList>
        </section>
      </DialogContent>
      <DialogFooter className={styles.footer}>
        <section
          className={`${styles.summarySection} ${localStyles.footerActions}`}
          aria-label="Selection"
        >
          <CheckOptionButton
            className={localStyles.replaceOption}
            label="Replace Current Workspace"
            selected={replaceWorkspace}
            onClick={() => setReplaceWorkspace((currentValue) => !currentValue)}
          />
          <Button
            label={actionLabel}
            size="lg"
            variant="filled"
            onClick={handleSubmit}
          />
        </section>
      </DialogFooter>
    </>
  );
}
