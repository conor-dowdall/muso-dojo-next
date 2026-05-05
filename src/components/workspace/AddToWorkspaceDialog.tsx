"use client";

import { useState } from "react";
import {
  chordProgressionTemplateTypeMetadata,
  chordProgressionTemplates,
  getNoteNamesForRootAndIntervals,
  getRomanNumeralForIntervalAndChordQuality,
  groupedChordProgressionTemplates,
  normalizeRootNoteString,
  type ChordQuality,
  type ChordProgressionTemplateKey,
  type Interval,
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
import styles from "@/components/music-group/AddToMusicGroupDialog.module.css";
import localStyles from "./AddToWorkspaceDialog.module.css";
import { type InstrumentCreationConfig } from "@/types/workspace";

type WorkspaceAddMode = "blank-group" | "chord-progression";
type WorkspaceChoice = "key" | "progression";
type ChordProgressionTemplateGroupKey =
  keyof typeof groupedChordProgressionTemplates;
type ChordProgressionTemplate =
  (typeof chordProgressionTemplates)[ChordProgressionTemplateKey];

interface ChordProgressionTemplateSection {
  name: string;
  chords: readonly ChordProgressionTemplateStep[];
}

interface ChordProgressionTemplateStep {
  interval: Interval;
  quality: ChordQuality;
}

interface AddToWorkspaceDialogProps {
  onAddBlankGroup: (settings: { replaceWorkspace: boolean }) => void;
  onAddChordProgression: (settings: {
    rootNote: RootNote;
    templateKey: ChordProgressionTemplateKey;
    sectionIndex: number;
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

const defaultProgressionTemplateKey =
  "oneFourFive" satisfies ChordProgressionTemplateKey;

function getProgressionTemplateKeys(
  groupKey: ChordProgressionTemplateGroupKey,
) {
  return Object.keys(
    groupedChordProgressionTemplates[groupKey],
  ) as ChordProgressionTemplateKey[];
}

function getTemplateStepCount(templateKey: ChordProgressionTemplateKey) {
  return getTemplateSections(templateKey).reduce(
    (count, section) => count + section.chords.length,
    0,
  );
}

function getTemplateSections(templateKey: ChordProgressionTemplateKey) {
  const template = chordProgressionTemplates[
    templateKey
  ] as ChordProgressionTemplate;

  return template.sections as readonly ChordProgressionTemplateSection[];
}

function toTitleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toLocaleUpperCase());
}

function getTemplateSubtitle(templateKey: ChordProgressionTemplateKey) {
  const template = chordProgressionTemplates[templateKey];
  const sections = getTemplateSections(templateKey);
  const typeName =
    chordProgressionTemplateTypeMetadata[template.templateType].displayName;

  if (sections.length > 1) {
    return `${sections.length} Section ${toTitleCase(typeName)}`;
  }

  return `${getTemplateStepCount(templateKey)} Chord ${toTitleCase(typeName)}`;
}

function getProgressionSummary(
  rootNote: RootNote,
  section: ChordProgressionTemplateSection | undefined,
) {
  const steps = section?.chords ?? [];
  const chordRootNotes = getNoteNamesForRootAndIntervals(
    rootNote,
    steps.map((step) => step.interval),
  );

  return {
    chordNames: chordRootNotes.map(
      (chordRootNote, index) =>
        `${chordRootNote}${steps[index]?.quality ?? ""}`,
    ),
    romanNames: steps.flatMap((step) => {
      const romanName = getRomanNumeralForIntervalAndChordQuality(
        step.interval,
        step.quality,
      );

      return romanName ? [romanName] : [];
    }),
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
  const [templateKey, setTemplateKey] = useState<ChordProgressionTemplateKey>(
    defaultProgressionTemplateKey,
  );
  const [sectionIndex, setSectionIndex] = useState(0);
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
  const selectedTemplate = chordProgressionTemplates[templateKey];
  const templateSections = getTemplateSections(templateKey);
  const resolvedSectionIndex =
    sectionIndex < templateSections.length ? sectionIndex : 0;
  const selectedTemplateSection = templateSections[resolvedSectionIndex];
  const progressionSummary = getProgressionSummary(
    selectedRootNote,
    selectedTemplateSection,
  );
  const progressionRomanLabel = progressionSummary.romanNames.join(" ");
  const progressionChordLabel = progressionSummary.chordNames.join(" ");
  const shouldShowProgressionRomanSubtitle =
    selectedTemplate.primaryName !== progressionRomanLabel;
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
      templateKey,
      sectionIndex: resolvedSectionIndex,
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
            <DisclosureListItem
              ariaLabel="Configure a progression practice set"
              isOpen={selectedMode === "chord-progression"}
              keepMounted
              label={workspaceAddOptions[1].title}
              selected={selectedMode === "chord-progression"}
              showSelectionIndicator
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
                    label={selectedTemplate.primaryName}
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
                      {(
                        Object.keys(
                          groupedChordProgressionTemplates,
                        ) as ChordProgressionTemplateGroupKey[]
                      ).map((groupKey) => (
                        <DisclosureListGroup key={groupKey}>
                          {getProgressionTemplateKeys(groupKey).map(
                            (candidateKey) => {
                              const candidate =
                                chordProgressionTemplates[candidateKey];
                              return (
                                <DisclosureListChoice
                                  key={candidateKey}
                                  label={candidate.primaryName}
                                  preview={getTemplateSubtitle(candidateKey)}
                                  selected={templateKey === candidateKey}
                                  onClick={() => {
                                    setTemplateKey(candidateKey);
                                    setSectionIndex(0);
                                    workspaceDisclosure.closeChoice(
                                      "progression",
                                    );
                                  }}
                                />
                              );
                            },
                          )}
                        </DisclosureListGroup>
                      ))}
                    </DisclosureList>
                  </DisclosureListItem>

                  {templateSections.length > 1 ? (
                    <DisclosureList>
                      {templateSections.map((section, index) => (
                        <DisclosureListChoice
                          key={`${section.name}-${index}`}
                          label={section.name}
                          preview={`${section.chords.length} Chords`}
                          selected={resolvedSectionIndex === index}
                          onClick={() => setSectionIndex(index)}
                        />
                      ))}
                    </DisclosureList>
                  ) : null}
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
            </DisclosureListItem>
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
