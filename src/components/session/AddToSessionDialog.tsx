"use client";

import { type ReactNode, useMemo, useState } from "react";
import {
  normalizeRootNoteString,
  type ChordProgressionKey,
  type NoteCollectionKey,
  type RootNote,
} from "@musodojo/music-theory-data";
import {
  LayoutPanelTop,
  ListChecks,
  ListMusic,
  Music3,
  Orbit,
} from "lucide-react";
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
import { type InstrumentCreationRangeContext } from "@/components/instrument-creation/instrumentCreationConfig";
import {
  ModuleCreationList,
  type ModuleCreationListDraft,
} from "@/components/part-module-creation/ModuleCreationList";
import { createRememberModuleCreationRequest } from "@/components/part-module-creation/moduleCreationDraft";
import { ChordProgressionPicker } from "@/components/music-theory/ChordProgressionPicker";
import { NoteCollectionPicker } from "@/components/music-theory/NoteCollectionPicker";
import { AddToSessionRootNoteItem } from "@/components/session/AddToSessionRootNoteItem";
import { useAppStore } from "@/stores/appStore";
import { getChordProgressionDisplayLabels } from "@/utils/music-theory/chordProgressions";
import { getChordProgressionRhythmProfile } from "@/utils/music-theory/chordProgressionRhythm";
import { getNoteCollectionDisplayName } from "@/utils/music-theory/getNoteCollectionDisplayName";
import { DISPLAY_VALUE_SEPARATOR } from "@/utils/valueSummary";
import localStyles from "./AddToSessionDialog.module.css";
import {
  type ChordProgressionChordListMode,
  type PartModuleCreationRequest,
  type SessionMaterialCreationKind,
} from "@/types/session";
import {
  DEFAULT_PART_NOTE_COLLECTION_KEY,
  DEFAULT_PART_ROOT_NOTE,
} from "@/utils/session/sessionDefaults";
import {
  DEFAULT_SESSION_MATERIAL_CREATION_CHORD_LIST_MODE,
  DEFAULT_SESSION_MATERIAL_CREATION_KIND,
  DEFAULT_SESSION_MATERIAL_CREATION_PROGRESSION_KEY,
} from "@/utils/session/sessionMaterialCreationDefaults";

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
    icon: <LayoutPanelTop />,
    id: "part",
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
  id: SessionMaterialCreationKind;
  title: string;
  subtitle: string;
}[];

const chordListOptions = [
  {
    id: "full-song-order",
    title: "Full Progression",
    subtitle: "Every Chord in Song Order",
  },
  {
    id: "each-chord-once",
    title: "Each Chord Once",
    subtitle: "One Part per Unique Chord",
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
  const sessionMaterialCreationDefaults = useAppStore(
    (state) => state.dojoSettings.sessionMaterialCreationDefaults,
  );
  const [selectedMode, setSelectedMode] = useState<SessionMaterialCreationKind>(
    () =>
      sessionMaterialCreationDefaults?.materialKind ??
      DEFAULT_SESSION_MATERIAL_CREATION_KIND,
  );
  const [rootNote, setRootNote] = useState<RootNote>(
    () => sessionMaterialCreationDefaults?.rootNote ?? DEFAULT_PART_ROOT_NOTE,
  );
  const [noteCollectionKey, setNoteCollectionKey] = useState<NoteCollectionKey>(
    () =>
      sessionMaterialCreationDefaults?.noteCollectionKey ??
      DEFAULT_PART_NOTE_COLLECTION_KEY,
  );
  const [progressionKey, setProgressionKey] = useState<ChordProgressionKey>(
    () =>
      sessionMaterialCreationDefaults?.progressionKey ??
      DEFAULT_SESSION_MATERIAL_CREATION_PROGRESSION_KEY,
  );
  const [chordListMode, setChordListMode] =
    useState<ChordProgressionChordListMode>(
      () =>
        sessionMaterialCreationDefaults?.chordListMode ??
        DEFAULT_SESSION_MATERIAL_CREATION_CHORD_LIST_MODE,
    );
  const [replaceSession, setReplaceSession] = useState(false);
  const [moduleDraft, setModuleDraft] =
    useState<ModuleCreationListDraft>(emptyModuleDraft);
  const sessionDisclosure = useDisclosureList<SessionChoice>();
  const rememberModuleCreation = useAppStore(
    (state) => state.rememberModuleCreation,
  );
  const rememberSessionMaterialCreation = useAppStore(
    (state) => state.rememberSessionMaterialCreation,
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
  const progressionRhythmProfile = useMemo(
    () => getChordProgressionRhythmProfile(progressionKey),
    [progressionKey],
  );
  const rhythmBeatCountConstraint = useMemo(
    () =>
      selectedMode === "chord-progression" &&
      chordListMode === "full-song-order" &&
      progressionRhythmProfile.requiredBarDivision > 1
        ? {
            requiredBarDivision: progressionRhythmProfile.requiredBarDivision,
          }
        : undefined,
    [chordListMode, progressionRhythmProfile.requiredBarDivision, selectedMode],
  );
  const rhythmPreferredStarterId =
    selectedMode === "chord-progression"
      ? progressionRhythmProfile.preferredRhythmStarterId
      : undefined;
  const canSubmit = moduleDraft.moduleRequests.length > 0;
  const effectiveReplaceSession = canReplaceSession && replaceSession;
  const actionLabel = effectiveReplaceSession
    ? "Replace Parts"
    : selectedMode === "part"
      ? "Add Part"
      : "Add Progression";

  const handleModeSelect = (mode: SessionMaterialCreationKind) => {
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
    rememberModuleCreation(
      createRememberModuleCreationRequest(moduleDraft, "session"),
    );
  };

  const rememberSessionMaterial = () => {
    rememberSessionMaterialCreation({
      chordListMode,
      materialKind: selectedMode,
      noteCollectionKey,
      progressionKey,
      rootNote: selectedRootNote,
    });
  };

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }

    if (selectedMode === "part") {
      onAddCustomChordOrScale({
        rootNote: selectedRootNote,
        noteCollectionKey,
        moduleRequests: moduleDraft.moduleRequests,
        replaceSession: effectiveReplaceSession,
      });
      rememberSessionMaterial();
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
    rememberSessionMaterial();
    rememberSessionModuleCreation();
    onClose();
  };

  return (
    <>
      <DialogHeader title="Add to Session" onClose={onClose} />
      <DialogContent layout="stack" menuRhythm="standard">
        <DialogContentSection ariaLabel="Material">
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
          <DisclosureList>
            {selectedMode === "part" ? (
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
                  icon={<Orbit />}
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
          <ModuleCreationList
            context="session"
            instrumentCreationRangeContext={instrumentCreationRangeContext}
            onDraftChange={setModuleDraft}
            rhythmBeatCountConstraint={rhythmBeatCountConstraint}
            rhythmPreferredStarterId={rhythmPreferredStarterId}
          />
        </DialogContentSection>
      </DialogContent>
      <DialogFooter>
        <DialogFooterActionBar ariaLabel="Selection">
          {canReplaceSession ? (
            <DialogFooterActionGroup placement="secondary">
              <CheckOptionButton
                label="Replace Existing Parts"
                selected={replaceSession}
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
              onClick={handleSubmit}
            />
          </DialogFooterActionGroup>
        </DialogFooterActionBar>
      </DialogFooter>
    </>
  );
}
