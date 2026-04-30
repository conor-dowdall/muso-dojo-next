"use client";

import {
  type CSSProperties,
  type ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  chordProgressionTemplateTypeMetadata,
  chordProgressionTemplates,
  getNoteNamesForRootAndIntervals,
  getRomanNumeralForIntervalAndChordQuality,
  groupedChordProgressionTemplates,
  normalizeRootNoteString,
  stringInstruments,
  type ChordQuality,
  type ChordProgressionTemplateKey,
  type Interval,
  type RootNote,
  type StringInstrumentKey,
  type StringInstrumentTuningKey,
} from "@musodojo/music-theory-data";
import {
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog/Dialog";
import { Button } from "@/components/ui/buttons/Button";
import { CheckOptionButton } from "@/components/ui/buttons/CheckOptionButton";
import { OptionButton } from "@/components/ui/buttons/OptionButton";
import { AddFretboardToMusicGroupPanel } from "@/components/music-group/AddFretboardToMusicGroupPanel";
import {
  AddKeyboardToMusicGroupPanel,
  type KeyboardRangeSelection,
} from "@/components/music-group/AddKeyboardToMusicGroupPanel";
import {
  ChoiceAccordion,
  ChoiceAccordionItem,
  useChoiceAccordion,
} from "@/components/music-group/ChoiceAccordion";
import { RootNoteGrid } from "@/components/music-group/RootNoteGrid";
import {
  addableMusicGroupOptions,
  type AddableMusicGroupItemType,
} from "@/components/music-group/addToMusicGroupOptions";
import styles from "@/components/music-group/AddToMusicGroupDialog.module.css";
import localStyles from "./AddToWorkspaceDialog.module.css";
import {
  DEFAULT_FRETBOARD_THEME,
  type FretboardThemeName,
} from "@/data/fretboard/themes";
import { DEFAULT_KEYBOARD_RANGE, keyboardRanges } from "@/data/keyboard/ranges";
import {
  DEFAULT_KEYBOARD_THEME,
  type KeyboardThemeName,
} from "@/data/keyboard/themes";
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

interface KeyboardSelection {
  range: KeyboardRangeSelection;
  midiRange: readonly [number, number];
  theme: KeyboardThemeName;
}

interface FretboardSelection {
  instrument: StringInstrumentKey;
  tuningKey: StringInstrumentTuningKey;
  fretRange: readonly [number, number];
  handedness: "right" | "left";
  theme: FretboardThemeName;
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

const defaultKeyboardSelection: KeyboardSelection = {
  range: DEFAULT_KEYBOARD_RANGE,
  midiRange: keyboardRanges[DEFAULT_KEYBOARD_RANGE].midiRange,
  theme: DEFAULT_KEYBOARD_THEME,
};

const defaultFretboardSelection: FretboardSelection = {
  instrument: "guitar",
  tuningKey: stringInstruments.guitar.defaultTuning,
  fretRange: [0, 12],
  handedness: "right",
  theme: DEFAULT_FRETBOARD_THEME,
};

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

function getInstrumentSettings(
  instrumentType: AddableMusicGroupItemType,
  keyboardSelection: KeyboardSelection,
  fretboardSelection: FretboardSelection,
): InstrumentCreationConfig {
  if (instrumentType === "keyboard") {
    return {
      ...(keyboardSelection.range === "custom"
        ? { config: { midiRange: keyboardSelection.midiRange } }
        : { range: keyboardSelection.range }),
      theme: keyboardSelection.theme,
    };
  }

  return {
    theme: fretboardSelection.theme,
    config: {
      instrument: fretboardSelection.instrument,
      tuningKey: fretboardSelection.tuningKey,
      fretRange: [...fretboardSelection.fretRange],
      leftHanded: fretboardSelection.handedness === "left",
    },
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
  const { closeChoice, closeAll, openChoice, toggleChoice } =
    useChoiceAccordion<WorkspaceChoice>();
  const [instrumentCloseSignal, setInstrumentCloseSignal] = useState(0);
  const [keyboardSelection, setKeyboardSelection] = useState<KeyboardSelection>(
    defaultKeyboardSelection,
  );
  const [fretboardSelection, setFretboardSelection] =
    useState<FretboardSelection>(defaultFretboardSelection);

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
    if (openChoice !== choice) {
      setInstrumentCloseSignal((currentSignal) => currentSignal + 1);
    }
    toggleChoice(choice);
  };

  const handleRootNoteSelect = (nextRootNote: RootNote) => {
    setRootNote(nextRootNote);
    closeChoice("key");
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
      instrumentSettings: getInstrumentSettings(
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
          <div className={styles.disclosureList}>
            {workspaceAddOptions.map((option) => (
              <OptionButton
                key={option.id}
                label={option.title}
                presentation="list"
                selected={selectedMode === option.id}
                onClick={() => setSelectedMode(option.id)}
              />
            ))}
          </div>
        </section>

        <AnimatedDetailPanel animationKey={selectedMode}>
          {selectedMode === "chord-progression" ? (
            <>
              <div className={styles.sectionGroup}>
                <section
                  className={styles.section}
                  aria-label="Progression setup"
                >
                  <ChoiceAccordion>
                    <ChoiceAccordionItem
                      ariaLabel={`Choose key, ${selectedRootNote} selected`}
                      isOpen={openChoice === "key"}
                      label={selectedRootNote}
                      subtitle="Key"
                      onToggle={() => handleWorkspaceChoiceToggle("key")}
                    >
                      <div className={localStyles.rootPanel}>
                        <RootNoteGrid
                          value={rootNote}
                          onChange={handleRootNoteSelect}
                        />
                      </div>
                    </ChoiceAccordionItem>

                    <ChoiceAccordionItem
                      ariaLabel={`Choose chord progression, ${progressionRomanLabel} gives ${progressionChordLabel}`}
                      isOpen={openChoice === "progression"}
                      label={selectedTemplate.primaryName}
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
                      onToggle={() =>
                        handleWorkspaceChoiceToggle("progression")
                      }
                    >
                      <div
                        className={`${styles.disclosureGroups} ${styles.indentedDisclosureGroups}`}
                      >
                        {(
                          Object.keys(
                            groupedChordProgressionTemplates,
                          ) as ChordProgressionTemplateGroupKey[]
                        ).map((groupKey) => (
                          <div
                            key={groupKey}
                            className={styles.disclosureGroup}
                          >
                            <div className={styles.disclosureList}>
                              {getProgressionTemplateKeys(groupKey).map(
                                (candidateKey) => {
                                  const candidate =
                                    chordProgressionTemplates[candidateKey];
                                  return (
                                    <OptionButton
                                      key={candidateKey}
                                      label={candidate.primaryName}
                                      presentation="list"
                                      preview={getTemplateSubtitle(
                                        candidateKey,
                                      )}
                                      selected={templateKey === candidateKey}
                                      onClick={() => {
                                        setTemplateKey(candidateKey);
                                        setSectionIndex(0);
                                        closeChoice("progression");
                                      }}
                                    />
                                  );
                                },
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ChoiceAccordionItem>
                  </ChoiceAccordion>
                </section>

                {templateSections.length > 1 ? (
                  <section className={styles.section} aria-label="Section">
                    <div
                      className={`${styles.disclosureList} ${localStyles.progressionSectionOptions}`}
                    >
                      {templateSections.map((section, index) => (
                        <OptionButton
                          key={`${section.name}-${index}`}
                          label={section.name}
                          presentation="list"
                          preview={`${section.chords.length} Chords`}
                          selected={resolvedSectionIndex === index}
                          onClick={() => setSectionIndex(index)}
                        />
                      ))}
                    </div>
                  </section>
                ) : null}
              </div>

              <div className={styles.sectionGroup}>
                <section className={styles.section} aria-label="Instrument">
                  <div className={styles.disclosureList}>
                    {addableMusicGroupOptions.map((option) => (
                      <OptionButton
                        key={option.id}
                        label={option.title}
                        presentation="list"
                        selected={instrumentType === option.id}
                        onClick={() => setInstrumentType(option.id)}
                      />
                    ))}
                  </div>
                </section>

                <AnimatedDetailPanel animationKey={instrumentType}>
                  {instrumentType === "keyboard" ? (
                    <AddKeyboardToMusicGroupPanel
                      closeSignal={instrumentCloseSignal}
                      value={keyboardSelection}
                      onChange={setKeyboardSelection}
                      onChoiceOpen={closeAll}
                    />
                  ) : (
                    <AddFretboardToMusicGroupPanel
                      closeSignal={instrumentCloseSignal}
                      value={fretboardSelection}
                      onChange={setFretboardSelection}
                      onChoiceOpen={closeAll}
                    />
                  )}
                </AnimatedDetailPanel>
              </div>
            </>
          ) : null}
        </AnimatedDetailPanel>
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

function AnimatedDetailPanel({
  animationKey,
  children,
}: {
  animationKey: string;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>();

  useLayoutEffect(() => {
    const panel = panelRef.current;

    if (!panel) {
      return;
    }

    const updateHeight = () => {
      setHeight(panel.offsetHeight);
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(panel);

    return () => observer.disconnect();
  }, [animationKey]);

  return (
    <div
      className={styles.detailPanelFrame}
      style={
        height === undefined
          ? undefined
          : ({
              "--detail-panel-height": `${height}px`,
            } as CSSProperties)
      }
    >
      <div key={animationKey} ref={panelRef} className={styles.detailPanel}>
        {children}
      </div>
    </div>
  );
}
