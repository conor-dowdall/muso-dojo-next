"use client";

import { useState } from "react";
import {
  normalizeRootNoteString,
  type ChordProgressionKey,
  type NoteCollectionKey,
  type RootNote,
} from "@musodojo/music-theory-data";
import { ListChecks, ListMusic, Music3, Shapes } from "lucide-react";
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
  createDefaultInstrumentSelections,
  getDefaultInstrumentType,
  getInstrumentCreationDefault,
  instrumentCreationDefaultMatchesSelection,
  type FretboardInstrumentSelection,
  type KeyboardInstrumentSelection,
} from "@/components/instrument-creation/instrumentCreationConfig";
import { InstrumentCreationDefaultAction } from "@/components/instrument-creation/InstrumentCreationDefaultAction";
import {
  type PartModuleCreationDraft,
  getPartModuleCreationConfig,
} from "@/components/part-module-creation/partModuleCreationConfig";
import { ChordProgressionPicker } from "@/components/music-theory/ChordProgressionPicker";
import { NoteCollectionPicker } from "@/components/music-theory/NoteCollectionPicker";
import {
  AddToSessionModuleSettings,
  type AddToSessionModuleSettingsProps,
} from "@/components/session/AddToSessionModuleSettings";
import { AddToSessionRootNoteItem } from "@/components/session/AddToSessionRootNoteItem";
import { getChordProgressionDisplayLabels } from "@/utils/music-theory/chordProgressions";
import { getNoteCollectionDisplayName } from "@/utils/music-theory/getNoteCollectionDisplayName";
import { DISPLAY_VALUE_SEPARATOR } from "@/utils/valueSummary";
import { useAppStore } from "@/stores/appStore";
import styles from "@/components/part-module-creation/PartModuleCreationDialog.module.css";
import localStyles from "./AddToSessionDialog.module.css";
import {
  type ChordProgressionChordListMode,
  type InstrumentType,
  type PartModuleCreationRequest,
} from "@/types/session";
import {
  DEFAULT_PART_MODULE_TYPE,
  DEFAULT_PART_NOTE_COLLECTION_KEY,
  DEFAULT_PART_ROOT_NOTE,
} from "@/utils/session/sessionDefaults";

type SessionAddMode = "custom-chord-or-scale" | "chord-progression";
type SessionChoice = "key" | "collection" | "progression" | "chord-list";

interface AddToSessionDialogProps {
  onAddCustomChordOrScale: (
    settings: {
      rootNote: RootNote;
      noteCollectionKey: NoteCollectionKey;
      replaceSession: boolean;
    } & PartModuleCreationRequest,
  ) => void;
  onAddChordProgression: (
    settings: {
      rootNote: RootNote;
      progressionKey: ChordProgressionKey;
      chordListMode: ChordProgressionChordListMode;
      replaceSession: boolean;
    } & PartModuleCreationRequest,
  ) => void;
  onClose: () => void;
}

const sessionAddOptions = [
  {
    id: "custom-chord-or-scale",
    title: "Chord or Scale",
    subtitle: `One Part${DISPLAY_VALUE_SEPARATOR}Root Note and Chord or Scale`,
  },
  {
    id: "chord-progression",
    title: "Chord Progression",
    subtitle: `Two or More Parts${DISPLAY_VALUE_SEPARATOR}Tonal Center and Progression`,
  },
] as const satisfies readonly {
  id: SessionAddMode;
  title: string;
  subtitle: string;
}[];

const defaultProgressionKey = "oneOneFiveFive" satisfies ChordProgressionKey;
const chordListOptions = [
  {
    id: "each-chord-once",
    title: "Each Chord Once",
    subtitle: "One Part per Unique Chord",
  },
  {
    id: "full-song-order",
    title: "Full Progression",
    subtitle: "Every Chord in Song Order",
  },
] as const satisfies readonly {
  id: ChordProgressionChordListMode;
  title: string;
  subtitle: string;
}[];

function getChordListOption(mode: ChordProgressionChordListMode) {
  return (
    chordListOptions.find((option) => option.id === mode) ?? chordListOptions[0]
  );
}

export function AddToSessionDialog({
  onAddCustomChordOrScale,
  onAddChordProgression,
  onClose,
}: AddToSessionDialogProps) {
  const [selectedMode, setSelectedMode] = useState<SessionAddMode>(
    "custom-chord-or-scale",
  );
  const [rootNote, setRootNote] = useState<RootNote>(DEFAULT_PART_ROOT_NOTE);
  const [noteCollectionKey, setNoteCollectionKey] = useState<NoteCollectionKey>(
    DEFAULT_PART_NOTE_COLLECTION_KEY,
  );
  const [progressionKey, setProgressionKey] = useState<ChordProgressionKey>(
    defaultProgressionKey,
  );
  const [chordListMode, setChordListMode] =
    useState<ChordProgressionChordListMode>("each-chord-once");
  const [replaceSession, setReplaceSession] = useState(false);
  const moduleType = DEFAULT_PART_MODULE_TYPE;
  const defaultInstrumentSetup = useAppStore(
    (state) => state.preferences.defaultInstrumentSetup,
  );
  const setDefaultInstrumentSetup = useAppStore(
    (state) => state.setDefaultInstrumentSetup,
  );
  const [instrumentType, setInstrumentType] = useState<InstrumentType>(() =>
    getDefaultInstrumentType(defaultInstrumentSetup),
  );
  const modeDisclosure = useDisclosureList<SessionAddMode>();
  const sessionDisclosure = useDisclosureList<SessionChoice>();
  const [moduleSettingsCloseSignal, setModuleSettingsCloseSignal] = useState(0);
  const [initialSelections] = useState(() =>
    createDefaultInstrumentSelections(undefined, defaultInstrumentSetup),
  );
  const [keyboardSelection, setKeyboardSelection] =
    useState<KeyboardInstrumentSelection>(initialSelections.keyboardSelection);
  const [fretboardSelection, setFretboardSelection] =
    useState<FretboardInstrumentSelection>(
      initialSelections.fretboardSelection,
    );

  const selectedRootNote =
    normalizeRootNoteString(rootNote) ?? DEFAULT_PART_ROOT_NOTE;
  const {
    chordLabel: progressionChordLabel,
    romanLabel: progressionRomanLabel,
    titleLabel: progressionTitleLabel,
  } = getChordProgressionDisplayLabels(selectedRootNote, progressionKey);
  const selectedChordListOption = getChordListOption(chordListMode);
  const selectedNoteCollectionName =
    getNoteCollectionDisplayName(noteCollectionKey);
  const creationDraft = {
    moduleType,
    instrumentType,
    keyboardSelection,
    fretboardSelection,
  } satisfies PartModuleCreationDraft;
  const actionLabel = replaceSession
    ? "Replace Session"
    : selectedMode === "custom-chord-or-scale"
      ? "Add Part"
      : "Add Progression";
  const moduleSettingsProps = {
    ...creationDraft,
    closeSignal: moduleSettingsCloseSignal,
    defaultInstrumentSetup,
    onChoiceOpen: sessionDisclosure.closeAll,
    onFretboardSelectionChange: setFretboardSelection,
    onInstrumentTypeChange: setInstrumentType,
    onKeyboardSelectionChange: setKeyboardSelection,
  } satisfies AddToSessionModuleSettingsProps;
  const isDefaultInstrumentSetup = instrumentCreationDefaultMatchesSelection(
    instrumentType,
    defaultInstrumentSetup,
    keyboardSelection,
    fretboardSelection,
  );

  const handleSessionChoiceToggle = (choice: SessionChoice) => {
    if (sessionDisclosure.openChoice !== choice) {
      setModuleSettingsCloseSignal((currentSignal) => currentSignal + 1);
    }
    sessionDisclosure.toggleChoice(choice);
  };

  const handleModeToggle = (mode: SessionAddMode) => {
    setSelectedMode(mode);
    sessionDisclosure.closeAll();
    modeDisclosure.toggleChoice(mode);
    setModuleSettingsCloseSignal((currentSignal) => currentSignal + 1);
  };

  const handleRootNoteSelect = (nextRootNote: RootNote) => {
    setRootNote(nextRootNote);
    sessionDisclosure.closeChoice("key");
  };

  const handleNoteCollectionSelect = (
    nextNoteCollectionKey: NoteCollectionKey,
  ) => {
    setNoteCollectionKey(nextNoteCollectionKey);
    sessionDisclosure.closeChoice("collection");
  };

  const handleSubmit = () => {
    const partModuleCreation = getPartModuleCreationConfig(creationDraft);

    if (selectedMode === "custom-chord-or-scale") {
      onAddCustomChordOrScale({
        rootNote: selectedRootNote,
        noteCollectionKey,
        moduleType: partModuleCreation.moduleType,
        moduleSettings: partModuleCreation.moduleSettings,
        replaceSession,
      });
      onClose();
      return;
    }

    onAddChordProgression({
      rootNote: selectedRootNote,
      progressionKey,
      chordListMode,
      moduleType: partModuleCreation.moduleType,
      replaceSession,
      moduleSettings: partModuleCreation.moduleSettings,
    });
    onClose();
  };
  const handleRememberInstrumentSetup = () => {
    setDefaultInstrumentSetup(
      getInstrumentCreationDefault(
        instrumentType,
        keyboardSelection,
        fretboardSelection,
      ),
    );
  };
  const renderRememberInstrumentSetupAction = () => (
    <DisclosureListGroup aria-label="Creation default">
      <InstrumentCreationDefaultAction
        instrumentType={instrumentType}
        isDefault={isDefaultInstrumentSetup}
        onRemember={handleRememberInstrumentSetup}
      />
    </DisclosureListGroup>
  );

  return (
    <>
      <DialogHeader title="Add to Session" onClose={onClose} />
      <DialogContent className={styles.content}>
        <section className={styles.section} aria-label="Session content type">
          <DisclosureList>
            <DisclosureListChoiceItem
              ariaLabel="Configure a chord or scale"
              icon={<Shapes />}
              isOpen={modeDisclosure.openChoice === "custom-chord-or-scale"}
              keepMounted
              label={sessionAddOptions[0].title}
              selected={selectedMode === "custom-chord-or-scale"}
              subtitle={sessionAddOptions[0].subtitle}
              onToggle={() => handleModeToggle("custom-chord-or-scale")}
            >
              <DisclosureList grouped groupGap="section">
                <DisclosureListGroup>
                  <AddToSessionRootNoteItem
                    icon={<Music3 />}
                    isOpen={sessionDisclosure.openChoice === "key"}
                    label="Root Note"
                    selectedRootNote={selectedRootNote}
                    value={rootNote}
                    onChange={handleRootNoteSelect}
                    onToggle={() => handleSessionChoiceToggle("key")}
                  />

                  <DisclosureListItem
                    ariaLabel={`Choose chord or scale, ${selectedNoteCollectionName} selected`}
                    icon={<Shapes />}
                    isOpen={sessionDisclosure.openChoice === "collection"}
                    keepMounted
                    label="Chord or Scale"
                    panelVariant="menu"
                    preview={selectedNoteCollectionName}
                    onToggle={() => handleSessionChoiceToggle("collection")}
                  >
                    <NoteCollectionPicker
                      value={noteCollectionKey}
                      onChange={handleNoteCollectionSelect}
                    />
                  </DisclosureListItem>
                </DisclosureListGroup>

                <AddToSessionModuleSettings {...moduleSettingsProps} />
                {renderRememberInstrumentSetupAction()}
              </DisclosureList>
            </DisclosureListChoiceItem>
            <DisclosureListChoiceItem
              ariaLabel="Configure a chord progression"
              icon={<ListMusic />}
              isOpen={modeDisclosure.openChoice === "chord-progression"}
              keepMounted
              label={sessionAddOptions[1].title}
              selected={selectedMode === "chord-progression"}
              subtitle={sessionAddOptions[1].subtitle}
              onToggle={() => handleModeToggle("chord-progression")}
            >
              <DisclosureList grouped groupGap="section">
                <DisclosureListGroup aria-label="Progression">
                  <AddToSessionRootNoteItem
                    icon={<Music3 />}
                    isOpen={sessionDisclosure.openChoice === "key"}
                    label="Tonal Center"
                    selectedRootNote={selectedRootNote}
                    value={rootNote}
                    onChange={handleRootNoteSelect}
                    onToggle={() => handleSessionChoiceToggle("key")}
                  />

                  <DisclosureListItem
                    ariaLabel={`Choose chord progression, ${progressionRomanLabel} gives ${progressionChordLabel}`}
                    icon={<ListMusic />}
                    isOpen={sessionDisclosure.openChoice === "progression"}
                    keepMounted
                    label="Progression"
                    panelVariant="menu"
                    preview={
                      <span
                        className={localStyles.progressionChordPreview}
                        title={progressionTitleLabel}
                      >
                        {progressionTitleLabel}
                      </span>
                    }
                    subtitle={
                      <span
                        className={localStyles.progressionChordPreview}
                        title={progressionChordLabel}
                      >
                        {progressionChordLabel}
                      </span>
                    }
                    onToggle={() => handleSessionChoiceToggle("progression")}
                  >
                    <ChordProgressionPicker
                      rootNote={selectedRootNote}
                      value={progressionKey}
                      onChange={(candidateKey) => {
                        setProgressionKey(candidateKey);
                        sessionDisclosure.closeChoice("progression");
                      }}
                    />
                  </DisclosureListItem>

                  <DisclosureListItem
                    ariaLabel={`Choose chords to add, ${selectedChordListOption.title} selected`}
                    icon={<ListChecks />}
                    isOpen={sessionDisclosure.openChoice === "chord-list"}
                    keepMounted
                    label="Chords to Add"
                    panelVariant="menu"
                    preview={selectedChordListOption.title}
                    onToggle={() => handleSessionChoiceToggle("chord-list")}
                  >
                    <DisclosureList>
                      {chordListOptions.map((option) => (
                        <DisclosureListChoice
                          key={option.id}
                          label={option.title}
                          selected={chordListMode === option.id}
                          subtitle={option.subtitle}
                          onClick={() => {
                            setChordListMode(option.id);
                            sessionDisclosure.closeChoice("chord-list");
                          }}
                        />
                      ))}
                    </DisclosureList>
                  </DisclosureListItem>
                </DisclosureListGroup>

                <AddToSessionModuleSettings {...moduleSettingsProps} />
                {renderRememberInstrumentSetupAction()}
              </DisclosureList>
            </DisclosureListChoiceItem>
          </DisclosureList>
        </section>
      </DialogContent>
      <DialogFooter className={styles.footer}>
        <section className={styles.summarySection} aria-label="Selection">
          <div className={styles.secondaryActions}>
            <CheckOptionButton
              label="Replace Current Session"
              selected={replaceSession}
              onClick={() => setReplaceSession((currentValue) => !currentValue)}
            />
          </div>
          <div className={styles.primaryActions}>
            <Button
              label={actionLabel}
              size="lg"
              variant="filled"
              onClick={handleSubmit}
            />
          </div>
        </section>
      </DialogFooter>
    </>
  );
}
