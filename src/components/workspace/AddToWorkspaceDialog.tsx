"use client";

import {
  type CSSProperties,
  type ReactNode,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  chordProgressionTemplateGroupsMetadata,
  chordProgressionTemplates,
  getChordProgressionTemplateChordNames,
  getChordProgressionTemplateRomanNames,
  groupedChordProgressionTemplates,
  normalizeRootNoteString,
  stringInstrumentTunings,
  stringInstruments,
  type ChordProgressionTemplateKey,
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
import { OptionButton } from "@/components/ui/buttons/OptionButton";
import { Heading } from "@/components/ui/typography/Heading";
import { Text } from "@/components/ui/typography/Text";
import { AddFretboardToMusicGroupPanel } from "@/components/music-group/AddFretboardToMusicGroupPanel";
import { AddKeyboardToMusicGroupPanel } from "@/components/music-group/AddKeyboardToMusicGroupPanel";
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
import {
  DEFAULT_KEYBOARD_RANGE,
  keyboardRanges,
  type KeyboardRangeName,
} from "@/data/keyboard/ranges";
import {
  DEFAULT_KEYBOARD_THEME,
  keyboardThemes,
  type KeyboardThemeName,
} from "@/data/keyboard/themes";
import { type InstrumentCreationConfig } from "@/types/workspace";

type WorkspaceAddMode = "blank-group" | "chord-progression";
type ChordProgressionTemplateGroupKey =
  keyof typeof groupedChordProgressionTemplates;
type ChordProgressionTemplate =
  (typeof chordProgressionTemplates)[ChordProgressionTemplateKey];

interface ChordProgressionTemplateSection {
  chords: readonly unknown[];
}

interface KeyboardSelection {
  range: KeyboardRangeName;
  theme: KeyboardThemeName;
}

interface FretboardSelection {
  instrument: StringInstrumentKey;
  tuningKey: StringInstrumentTuningKey;
  theme: FretboardThemeName;
}

interface AddToWorkspaceDialogProps {
  onAddBlankGroup: () => void;
  onAddChordProgression: (settings: {
    rootNote: RootNote;
    templateKey: ChordProgressionTemplateKey;
    instrumentType: AddableMusicGroupItemType;
    instrumentSettings: InstrumentCreationConfig;
  }) => void;
  onClose: () => void;
}

const workspaceAddOptions = [
  { id: "blank-group", title: "Blank group" },
  { id: "chord-progression", title: "Chord progression" },
] as const satisfies readonly { id: WorkspaceAddMode; title: string }[];

const defaultKeyboardSelection: KeyboardSelection = {
  range: DEFAULT_KEYBOARD_RANGE,
  theme: DEFAULT_KEYBOARD_THEME,
};

const defaultFretboardSelection: FretboardSelection = {
  instrument: "guitar",
  tuningKey: stringInstruments.guitar.defaultTuning,
  theme: DEFAULT_FRETBOARD_THEME,
};

const defaultProgressionTemplateKey =
  "axisProgression" satisfies ChordProgressionTemplateKey;

function getProgressionTemplateKeys(
  groupKey: ChordProgressionTemplateGroupKey,
) {
  return Object.keys(
    groupedChordProgressionTemplates[groupKey],
  ) as ChordProgressionTemplateKey[];
}

function getTemplateStepCount(templateKey: ChordProgressionTemplateKey) {
  const template = chordProgressionTemplates[
    templateKey
  ] as ChordProgressionTemplate;

  return (
    template.sections as readonly ChordProgressionTemplateSection[]
  ).reduce((count, section) => count + section.chords.length, 0);
}

function getProgressionPreview(
  rootNote: RootNote,
  templateKey: ChordProgressionTemplateKey,
) {
  return getChordProgressionTemplateChordNames(rootNote, templateKey).join(" ");
}

function getInstrumentSettings(
  instrumentType: AddableMusicGroupItemType,
  keyboardSelection: KeyboardSelection,
  fretboardSelection: FretboardSelection,
): InstrumentCreationConfig {
  if (instrumentType === "keyboard") {
    return {
      range: keyboardSelection.range,
      theme: keyboardSelection.theme,
    };
  }

  return {
    theme: fretboardSelection.theme,
    config: {
      instrument: fretboardSelection.instrument,
      tuningKey: fretboardSelection.tuningKey,
    },
  };
}

function getInstrumentSummary(
  instrumentType: AddableMusicGroupItemType,
  keyboardSelection: KeyboardSelection,
  fretboardSelection: FretboardSelection,
) {
  if (instrumentType === "keyboard") {
    return `${keyboardRanges[keyboardSelection.range].title} keyboard, ${keyboardThemes[keyboardSelection.theme].title} look`;
  }

  return `${stringInstruments[fretboardSelection.instrument].primaryName}, ${stringInstrumentTunings[fretboardSelection.tuningKey].primaryName} tuning`;
}

export function AddToWorkspaceDialog({
  onAddBlankGroup,
  onAddChordProgression,
  onClose,
}: AddToWorkspaceDialogProps) {
  const typeHeadingId = useId();
  const rootHeadingId = useId();
  const progressionHeadingId = useId();
  const instrumentHeadingId = useId();
  const [selectedMode, setSelectedMode] =
    useState<WorkspaceAddMode>("blank-group");
  const [rootNote, setRootNote] = useState<RootNote>("C");
  const [templateKey, setTemplateKey] = useState<ChordProgressionTemplateKey>(
    defaultProgressionTemplateKey,
  );
  const [instrumentType, setInstrumentType] =
    useState<AddableMusicGroupItemType>("keyboard");
  const [keyboardSelection, setKeyboardSelection] = useState<KeyboardSelection>(
    defaultKeyboardSelection,
  );
  const [fretboardSelection, setFretboardSelection] =
    useState<FretboardSelection>(defaultFretboardSelection);

  const selectedRootNote = normalizeRootNoteString(rootNote) ?? "C";
  const template = chordProgressionTemplates[templateKey];
  const progressionPreview = getProgressionPreview(
    selectedRootNote,
    templateKey,
  );
  const actionLabel =
    selectedMode === "blank-group" ? "Add group" : "Add progression";
  const selectedSummary =
    selectedMode === "blank-group"
      ? "Blank group"
      : `${template.primaryName}, ${getInstrumentSummary(
          instrumentType,
          keyboardSelection,
          fretboardSelection,
        )}`;

  const handleSubmit = () => {
    if (selectedMode === "blank-group") {
      onAddBlankGroup();
      onClose();
      return;
    }

    onAddChordProgression({
      rootNote: selectedRootNote,
      templateKey,
      instrumentType,
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
        <section className={styles.section} aria-labelledby={typeHeadingId}>
          <div className={styles.sectionHeader}>
            <Heading as="h3" id={typeHeadingId} size="sm" weight="semibold">
              Type
            </Heading>
          </div>

          <div className={styles.optionGrid}>
            {workspaceAddOptions.map((option) => (
              <OptionButton
                key={option.id}
                label={option.title}
                presentation="tile"
                selected={selectedMode === option.id}
                onClick={() => setSelectedMode(option.id)}
              />
            ))}
          </div>
        </section>

        <AnimatedDetailPanel animationKey={selectedMode}>
          {selectedMode === "chord-progression" ? (
            <>
              <section
                className={styles.section}
                aria-labelledby={rootHeadingId}
              >
                <div className={styles.sectionHeader}>
                  <Heading
                    as="h3"
                    id={rootHeadingId}
                    size="sm"
                    weight="semibold"
                  >
                    Root
                  </Heading>
                </div>
                <div className={localStyles.rootPanel}>
                  <RootNoteGrid value={rootNote} onChange={setRootNote} />
                </div>
              </section>

              <section
                className={styles.section}
                aria-labelledby={progressionHeadingId}
              >
                <div className={styles.sectionHeader}>
                  <Heading
                    as="h3"
                    id={progressionHeadingId}
                    size="sm"
                    weight="semibold"
                  >
                    Progression
                  </Heading>
                </div>

                <div className={styles.optionGroups}>
                  {(
                    Object.keys(
                      groupedChordProgressionTemplates,
                    ) as ChordProgressionTemplateGroupKey[]
                  ).map((groupKey) => (
                    <div key={groupKey} className={styles.optionGroup}>
                      <Heading as="h4" size="xs" variant="muted">
                        {
                          chordProgressionTemplateGroupsMetadata[groupKey]
                            .displayName
                        }
                      </Heading>
                      <div
                        className={`${styles.optionGrid} ${styles.compactGrid}`}
                      >
                        {getProgressionTemplateKeys(groupKey).map(
                          (candidateKey) => {
                            const candidate =
                              chordProgressionTemplates[candidateKey];
                            const romanNames =
                              getChordProgressionTemplateRomanNames(
                                candidateKey,
                              );

                            return (
                              <OptionButton
                                key={candidateKey}
                                label={candidate.primaryName}
                                presentation="tile"
                                selected={templateKey === candidateKey}
                                subtitle={`${romanNames.join(" ")} - ${getTemplateStepCount(candidateKey)} chords`}
                                onClick={() => setTemplateKey(candidateKey)}
                              />
                            );
                          },
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section
                className={styles.section}
                aria-labelledby={instrumentHeadingId}
              >
                <div className={styles.sectionHeader}>
                  <Heading
                    as="h3"
                    id={instrumentHeadingId}
                    size="sm"
                    weight="semibold"
                  >
                    Instrument
                  </Heading>
                </div>

                <div className={styles.optionGrid}>
                  {addableMusicGroupOptions.map((option) => (
                    <OptionButton
                      key={option.id}
                      label={option.title}
                      presentation="tile"
                      selected={instrumentType === option.id}
                      onClick={() => setInstrumentType(option.id)}
                    />
                  ))}
                </div>
              </section>

              <AnimatedDetailPanel animationKey={instrumentType}>
                {instrumentType === "keyboard" ? (
                  <AddKeyboardToMusicGroupPanel
                    value={keyboardSelection}
                    onChange={setKeyboardSelection}
                  />
                ) : (
                  <AddFretboardToMusicGroupPanel
                    value={fretboardSelection}
                    onChange={setFretboardSelection}
                  />
                )}
              </AnimatedDetailPanel>
            </>
          ) : null}
        </AnimatedDetailPanel>
      </DialogContent>
      <DialogFooter className={styles.footer}>
        <section className={styles.summarySection} aria-label="Selection">
          <div className={styles.summaryCopy}>
            <Text as="p" size="sm">
              {selectedSummary}
            </Text>
            {selectedMode === "chord-progression" ? (
              <Text
                as="p"
                className={localStyles.progressionPreview}
                size="xs"
                variant="muted"
              >
                {progressionPreview}
              </Text>
            ) : null}
          </div>
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
