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
  DialogContentSection,
  DialogFooter,
  DialogFooterActionBar,
  DialogFooterActionGroup,
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
import { type InstrumentCreationRangeContext } from "@/components/instrument-creation/instrumentCreationConfig";
import { InstrumentCreationDefaultAction } from "@/components/instrument-creation/InstrumentCreationDefaultAction";
import { useInstrumentCreationDraft } from "@/components/instrument-creation/useInstrumentCreationDraft";
import {
  type PartModuleCreationDraft,
  getPartModuleCreationRequest,
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
import localStyles from "./AddToSessionDialog.module.css";
import {
  type ChordProgressionChordListMode,
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
  instrumentCreationRangeContext?: InstrumentCreationRangeContext;
  onAddCustomChordOrScale: (settings: {
    rootNote: RootNote;
    noteCollectionKey: NoteCollectionKey;
    initialModule: PartModuleCreationRequest;
    replaceSession: boolean;
  }) => void;
  onAddChordProgression: (settings: {
    rootNote: RootNote;
    progressionKey: ChordProgressionKey;
    chordListMode: ChordProgressionChordListMode;
    initialModule: PartModuleCreationRequest;
    replaceSession: boolean;
  }) => void;
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
  instrumentCreationRangeContext,
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
  const modeDisclosure = useDisclosureList<SessionAddMode>();
  const sessionDisclosure = useDisclosureList<SessionChoice>();
  const [moduleSettingsCloseSignal, setModuleSettingsCloseSignal] = useState(0);
  const {
    defaultInstrumentSetup,
    fretboardSelection,
    instrumentType,
    isDefaultInstrumentSetup,
    keyboardSelection,
    setFretboardSelection,
    setInstrumentType,
    setKeyboardSelection,
    useCurrentSetupForNewInstruments,
  } = useInstrumentCreationDraft(instrumentCreationRangeContext);

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
    const initialModule = getPartModuleCreationRequest(creationDraft);

    if (selectedMode === "custom-chord-or-scale") {
      onAddCustomChordOrScale({
        rootNote: selectedRootNote,
        noteCollectionKey,
        initialModule,
        replaceSession,
      });
      onClose();
      return;
    }

    onAddChordProgression({
      rootNote: selectedRootNote,
      progressionKey,
      chordListMode,
      initialModule,
      replaceSession,
    });
    onClose();
  };
  const renderDefaultInstrumentAction = () => (
    <DisclosureListGroup aria-label="Creation default">
      <InstrumentCreationDefaultAction
        fretboardSelection={fretboardSelection}
        instrumentType={instrumentType}
        isDefault={isDefaultInstrumentSetup}
        keyboardSelection={keyboardSelection}
        onUseForNewInstruments={useCurrentSetupForNewInstruments}
      />
    </DisclosureListGroup>
  );

  return (
    <>
      <DialogHeader title="Add to Session" onClose={onClose} />
      <DialogContent layout="stack" menuRhythm="standard">
        <DialogContentSection ariaLabel="Session content type">
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
                {renderDefaultInstrumentAction()}
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
                {renderDefaultInstrumentAction()}
              </DisclosureList>
            </DisclosureListChoiceItem>
          </DisclosureList>
        </DialogContentSection>
      </DialogContent>
      <DialogFooter>
        <DialogFooterActionBar ariaLabel="Selection">
          <DialogFooterActionGroup placement="secondary">
            <CheckOptionButton
              label="Replace Current Session"
              selected={replaceSession}
              subtitle="Clears current parts before adding"
              onClick={() => setReplaceSession((currentValue) => !currentValue)}
            />
          </DialogFooterActionGroup>
          <DialogFooterActionGroup placement="primary">
            <Button
              label={actionLabel}
              size="lg"
              variant="filled"
              onClick={handleSubmit}
            />
          </DialogFooterActionGroup>
        </DialogFooterActionBar>
      </DialogFooter>
    </>
  );
}
