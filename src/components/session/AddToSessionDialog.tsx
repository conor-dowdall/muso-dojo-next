"use client";

import { type ReactNode, useState } from "react";
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
  DisclosureListItem,
  useDisclosureList,
} from "@/components/ui/disclosure-list/DisclosureList";
import { Heading } from "@/components/ui/typography/Heading";
import { type InstrumentCreationRangeContext } from "@/components/instrument-creation/instrumentCreationConfig";
import {
  ModuleCreationList,
  type ModuleCreationListDraft,
} from "@/components/part-module-creation/ModuleCreationList";
import { ChordProgressionPicker } from "@/components/music-theory/ChordProgressionPicker";
import { NoteCollectionPicker } from "@/components/music-theory/NoteCollectionPicker";
import { AddToSessionRootNoteItem } from "@/components/session/AddToSessionRootNoteItem";
import { useAppStore } from "@/stores/appStore";
import { getChordProgressionDisplayLabels } from "@/utils/music-theory/chordProgressions";
import { getNoteCollectionDisplayName } from "@/utils/music-theory/getNoteCollectionDisplayName";
import { DISPLAY_VALUE_SEPARATOR } from "@/utils/valueSummary";
import localStyles from "./AddToSessionDialog.module.css";
import {
  type ChordProgressionChordListMode,
  type PartModuleCreationRequest,
} from "@/types/session";
import {
  DEFAULT_PART_NOTE_COLLECTION_KEY,
  DEFAULT_PART_ROOT_NOTE,
} from "@/utils/session/sessionDefaults";

type SessionAddMode = "custom-chord-or-scale" | "chord-progression";
type SessionChoice = "key" | "collection" | "progression" | "chord-list";

interface AddToSessionDialogProps {
  canReplaceSession?: boolean;
  instrumentCreationRangeContext?: InstrumentCreationRangeContext;
  onAddCustomChordOrScale: (settings: {
    rootNote: RootNote;
    noteCollectionKey: NoteCollectionKey;
    moduleRequests: PartModuleCreationRequest[];
    replaceSession: boolean;
  }) => void;
  onAddChordProgression: (settings: {
    rootNote: RootNote;
    progressionKey: ChordProgressionKey;
    chordListMode: ChordProgressionChordListMode;
    moduleRequests: PartModuleCreationRequest[];
    replaceSession: boolean;
  }) => void;
  onClose: () => void;
}

const sessionAddOptions = [
  {
    icon: <Shapes />,
    id: "custom-chord-or-scale",
    title: "Part",
    subtitle: `One Part${DISPLAY_VALUE_SEPARATOR}Root Note and Chord or Scale`,
  },
  {
    icon: <ListMusic />,
    id: "chord-progression",
    title: "Chord Progression",
    subtitle: `Two or More Parts${DISPLAY_VALUE_SEPARATOR}Tonal Center and Progression`,
  },
] as const satisfies readonly {
  icon: ReactNode;
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

const emptyModuleDraft = {
  moduleKinds: [],
  moduleRequests: [],
} satisfies ModuleCreationListDraft;

function getChordListOption(mode: ChordProgressionChordListMode) {
  return (
    chordListOptions.find((option) => option.id === mode) ?? chordListOptions[0]
  );
}

export function AddToSessionDialog({
  canReplaceSession = true,
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
  const [moduleDraft, setModuleDraft] =
    useState<ModuleCreationListDraft>(emptyModuleDraft);
  const sessionDisclosure = useDisclosureList<SessionChoice>();
  const rememberModuleCreation = useAppStore(
    (state) => state.rememberModuleCreation,
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
  const canSubmit = moduleDraft.moduleRequests.length > 0;
  const effectiveReplaceSession = canReplaceSession && replaceSession;
  const actionLabel = effectiveReplaceSession
    ? "Replace Session"
    : selectedMode === "custom-chord-or-scale"
      ? "Add Part"
      : "Add Progression";

  const handleModeSelect = (mode: SessionAddMode) => {
    setSelectedMode(mode);
    sessionDisclosure.closeAll();
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

  const rememberSessionModuleCreation = () => {
    rememberModuleCreation({
      context: "session",
      moduleKinds: moduleDraft.moduleKinds,
      ...(moduleDraft.fretboard ? { fretboard: moduleDraft.fretboard } : {}),
      ...(moduleDraft.keyboard ? { keyboard: moduleDraft.keyboard } : {}),
    });
  };

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }

    if (selectedMode === "custom-chord-or-scale") {
      onAddCustomChordOrScale({
        rootNote: selectedRootNote,
        noteCollectionKey,
        moduleRequests: moduleDraft.moduleRequests,
        replaceSession: effectiveReplaceSession,
      });
      rememberSessionModuleCreation();
      onClose();
      return;
    }

    onAddChordProgression({
      rootNote: selectedRootNote,
      progressionKey,
      chordListMode,
      moduleRequests: moduleDraft.moduleRequests,
      replaceSession: effectiveReplaceSession,
    });
    rememberSessionModuleCreation();
    onClose();
  };

  return (
    <>
      <DialogHeader title="Add to Session" onClose={onClose} />
      <DialogContent layout="stack" menuRhythm="standard">
        <DialogContentSection ariaLabel="Material">
          <Heading
            as="h3"
            className={localStyles.sectionHeading}
            size="xs"
            variant="muted"
          >
            Material
          </Heading>
          <DisclosureList>
            {sessionAddOptions.map((option) => (
              <DisclosureListChoice
                key={option.id}
                icon={option.icon}
                label={option.title}
                selected={selectedMode === option.id}
                subtitle={option.subtitle}
                onClick={() => handleModeSelect(option.id)}
              />
            ))}
          </DisclosureList>
        </DialogContentSection>

        <DialogContentSection ariaLabel="Music">
          <Heading
            as="h3"
            className={localStyles.sectionHeading}
            size="xs"
            variant="muted"
          >
            Music
          </Heading>
          <DisclosureList>
            {selectedMode === "custom-chord-or-scale" ? (
              <>
                <AddToSessionRootNoteItem
                  icon={<Music3 />}
                  isOpen={sessionDisclosure.openChoice === "key"}
                  label="Root Note"
                  selectedRootNote={selectedRootNote}
                  value={rootNote}
                  onChange={handleRootNoteSelect}
                  onToggle={() => sessionDisclosure.toggleChoice("key")}
                />

                <DisclosureListItem
                  ariaLabel={`Choose chord or scale, ${selectedNoteCollectionName} selected`}
                  icon={<Shapes />}
                  isOpen={sessionDisclosure.openChoice === "collection"}
                  keepMounted
                  label="Chord or Scale"
                  panelVariant="menu"
                  preview={selectedNoteCollectionName}
                  onToggle={() => sessionDisclosure.toggleChoice("collection")}
                >
                  <NoteCollectionPicker
                    value={noteCollectionKey}
                    onChange={handleNoteCollectionSelect}
                  />
                </DisclosureListItem>
              </>
            ) : (
              <>
                <AddToSessionRootNoteItem
                  icon={<Music3 />}
                  isOpen={sessionDisclosure.openChoice === "key"}
                  label="Tonal Center"
                  selectedRootNote={selectedRootNote}
                  value={rootNote}
                  onChange={handleRootNoteSelect}
                  onToggle={() => sessionDisclosure.toggleChoice("key")}
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
                  onToggle={() => sessionDisclosure.toggleChoice("progression")}
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
                  onToggle={() => sessionDisclosure.toggleChoice("chord-list")}
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
              </>
            )}
          </DisclosureList>
        </DialogContentSection>

        <DialogContentSection ariaLabel="Start With">
          <Heading
            as="h3"
            className={localStyles.sectionHeading}
            size="xs"
            variant="muted"
          >
            Start With
          </Heading>
          <ModuleCreationList
            context="session"
            instrumentCreationRangeContext={instrumentCreationRangeContext}
            onDraftChange={setModuleDraft}
          />
        </DialogContentSection>
      </DialogContent>
      <DialogFooter>
        <DialogFooterActionBar ariaLabel="Selection">
          {canReplaceSession ? (
            <DialogFooterActionGroup placement="secondary">
              <CheckOptionButton
                label="Replace Current Session"
                selected={replaceSession}
                subtitle="Clears current parts before adding"
                onClick={() =>
                  setReplaceSession((currentValue) => !currentValue)
                }
              />
            </DialogFooterActionGroup>
          ) : null}
          <DialogFooterActionGroup placement="primary">
            <Button
              disabled={!canSubmit}
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
