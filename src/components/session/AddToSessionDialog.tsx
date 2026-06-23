"use client";

import { type ReactNode, useState } from "react";
import {
  normalizeRootNoteString,
  type ChordProgressionKey,
  type NoteCollectionKey,
  type RootNote,
} from "@musodojo/music-theory-data";
import {
  AudioWaveform,
  Drum,
  LayoutPanelTop,
  ListChecks,
  ListMusic,
  Music3,
  Orbit,
  UsersRound,
  WavesArrowDown,
  WavesArrowUp,
} from "lucide-react";
import {
  audioPresets,
  ensureAudioReady,
  musoAudioEngine,
  type AudioPresetId,
} from "@/audio";
import { AudioPresetChoiceList } from "@/components/audio/AudioPresetChoiceList";
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
import { getNoteCollectionDisplayName } from "@/utils/music-theory/getNoteCollectionDisplayName";
import { DISPLAY_VALUE_SEPARATOR } from "@/utils/valueSummary";
import localStyles from "./AddToSessionDialog.module.css";
import {
  type ChordProgressionChordListMode,
  type PartModuleCreationRequest,
  type PracticeBandConfig,
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
import {
  DEFAULT_PRACTICE_BAND_AUDIO_PRESET_ID,
  DEFAULT_PRACTICE_BAND_DRUMS_ENABLED,
  DEFAULT_PRACTICE_BAND_OCTAVE_OFFSET,
  formatPracticeBandOctave,
} from "@/utils/practice-band/practiceBandConfig";
import {
  EXERCISE_MAX_OCTAVE_OFFSET,
  EXERCISE_MIN_OCTAVE_OFFSET,
} from "@/utils/exercise-looper/exerciseConfig";

type AddToSessionMode = SessionMaterialCreationKind | "practice-band";
type SessionChoice =
  | "key"
  | "collection"
  | "progression"
  | "chord-list"
  | "practice-band-sound"
  | "practice-band-octave";

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
  hasPracticeBand?: boolean;
  onAddPracticeBand: (settings: PracticeBandConfig) => void;
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
  {
    icon: <UsersRound />,
    id: "practice-band",
    title: "Practice Band",
    subtitle: `Follows Parts${DISPLAY_VALUE_SEPARATOR}Looper and Drums`,
  },
] as const satisfies readonly {
  icon: ReactNode;
  id: AddToSessionMode;
  title: string;
  subtitle: string;
}[];

const practiceBandOctaveOffsets = Array.from(
  {
    length: EXERCISE_MAX_OCTAVE_OFFSET - EXERCISE_MIN_OCTAVE_OFFSET + 1,
  },
  (_, index) => EXERCISE_MIN_OCTAVE_OFFSET + index,
);

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
  hasPracticeBand = false,
  instrumentCreationRangeContext,
  onAddCustomChordOrScale,
  onAddChordProgression,
  onAddPracticeBand,
  onClose,
}: AddToSessionDialogProps) {
  const sessionMaterialCreationDefaults = useAppStore(
    (state) => state.dojoSettings.sessionMaterialCreationDefaults,
  );
  const [selectedMode, setSelectedMode] = useState<AddToSessionMode>(
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
  const [practiceBandAudioPresetId, setPracticeBandAudioPresetId] =
    useState<AudioPresetId>(DEFAULT_PRACTICE_BAND_AUDIO_PRESET_ID);
  const [practiceBandDrums, setPracticeBandDrums] = useState(
    DEFAULT_PRACTICE_BAND_DRUMS_ENABLED,
  );
  const [practiceBandOctaveOffset, setPracticeBandOctaveOffset] = useState(
    DEFAULT_PRACTICE_BAND_OCTAVE_OFFSET,
  );
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
  const selectedPracticeBandPreset = audioPresets[practiceBandAudioPresetId];
  const practiceBandOctaveLabel = formatPracticeBandOctave(
    practiceBandOctaveOffset,
  );
  const canSubmit =
    selectedMode === "practice-band"
      ? !hasPracticeBand
      : moduleDraft.moduleRequests.length > 0;
  const effectiveReplaceSession =
    selectedMode !== "practice-band" && canReplaceSession && replaceSession;
  const actionLabel = effectiveReplaceSession
    ? "Replace Session"
    : selectedMode === "part"
      ? "Add Part"
      : selectedMode === "chord-progression"
        ? "Add Progression"
        : hasPracticeBand
          ? "Practice Band Added"
          : "Add Practice Band";

  const handleModeSelect = (mode: AddToSessionMode) => {
    if (mode === "practice-band" && hasPracticeBand) {
      return;
    }

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
    rememberModuleCreation(createRememberModuleCreationRequest(moduleDraft));
  };

  const rememberSessionMaterial = () => {
    if (selectedMode === "practice-band") {
      return;
    }

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

    if (selectedMode === "practice-band") {
      onAddPracticeBand({
        audioPresetId: practiceBandAudioPresetId,
        drums: practiceBandDrums,
        octaveOffset: practiceBandOctaveOffset,
      });
      onClose();
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
            {sessionAddOptions.map((option) => {
              const practiceBandAlreadyAdded =
                option.id === "practice-band" && hasPracticeBand;

              return (
                <DisclosureListChoice
                  key={option.id}
                  disabled={practiceBandAlreadyAdded}
                  icon={option.icon}
                  label={option.title}
                  preview={practiceBandAlreadyAdded ? "Added" : undefined}
                  selected={selectedMode === option.id}
                  subtitle={
                    practiceBandAlreadyAdded
                      ? `Already in Session${DISPLAY_VALUE_SEPARATOR}One per Session`
                      : option.subtitle
                  }
                  onClick={() => handleModeSelect(option.id)}
                />
              );
            })}
          </DisclosureList>
        </DialogContentSection>

        {selectedMode === "practice-band" ? (
          <DialogContentSection ariaLabel="Practice Band">
            <DisclosureList>
              <DisclosureListItem
                ariaLabel={`Choose Practice Band sound, ${selectedPracticeBandPreset.label} selected`}
                icon={<AudioWaveform />}
                isOpen={sessionDisclosure.openChoice === "practice-band-sound"}
                keepMounted
                label="Playback Sound"
                panelVariant="menu"
                preview={selectedPracticeBandPreset.label}
                onToggle={() =>
                  sessionDisclosure.toggleChoice("practice-band-sound")
                }
              >
                <AudioPresetChoiceList
                  getChoiceAriaLabel={(choice) =>
                    `Use ${choice.label} for Practice Band notes`
                  }
                  selectedPresetId={practiceBandAudioPresetId}
                  surface="exercise"
                  onChange={(nextPresetId) => {
                    setPracticeBandAudioPresetId(nextPresetId);
                    void ensureAudioReady();
                    void musoAudioEngine.playNote({
                      midiNote: 48,
                      presetId: nextPresetId,
                      use: "exercise",
                    });
                  }}
                />
              </DisclosureListItem>

              <DisclosureListItem
                ariaLabel={`Choose Practice Band octave, ${practiceBandOctaveLabel} selected`}
                icon={<WavesArrowUp />}
                isOpen={sessionDisclosure.openChoice === "practice-band-octave"}
                keepMounted
                label="Octave"
                panelVariant="menu"
                preview={practiceBandOctaveLabel}
                onToggle={() =>
                  sessionDisclosure.toggleChoice("practice-band-octave")
                }
              >
                <DisclosureList density="compact">
                  {practiceBandOctaveOffsets.map((octaveOffset) => {
                    const octaveLabel = formatPracticeBandOctave(octaveOffset);

                    return (
                      <DisclosureListChoice
                        key={octaveOffset}
                        aria-label={`Use ${octaveLabel} for Practice Band notes`}
                        icon={
                          octaveOffset < practiceBandOctaveOffset ? (
                            <WavesArrowDown />
                          ) : octaveOffset > practiceBandOctaveOffset ? (
                            <WavesArrowUp />
                          ) : undefined
                        }
                        label={octaveLabel}
                        selected={practiceBandOctaveOffset === octaveOffset}
                        onClick={() => {
                          setPracticeBandOctaveOffset(octaveOffset);
                          sessionDisclosure.closeChoice("practice-band-octave");
                        }}
                      />
                    );
                  })}
                </DisclosureList>
              </DisclosureListItem>

              <DisclosureListChoice
                aria-label={
                  practiceBandDrums
                    ? "Turn off default Practice Band drums"
                    : "Turn on default Practice Band drums"
                }
                icon={<Drum />}
                label="Drums"
                preview={practiceBandDrums ? "On" : "Off"}
                selected={practiceBandDrums}
                subtitle="Plays Part rhythms and default drums"
                onClick={() => setPracticeBandDrums((enabled) => !enabled)}
              />
            </DisclosureList>
          </DialogContentSection>
        ) : (
          <>
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
                      onToggle={() =>
                        sessionDisclosure.toggleChoice("collection")
                      }
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
                      onToggle={() =>
                        sessionDisclosure.toggleChoice("progression")
                      }
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
                      onToggle={() =>
                        sessionDisclosure.toggleChoice("chord-list")
                      }
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
                instrumentCreationRangeContext={instrumentCreationRangeContext}
                onDraftChange={setModuleDraft}
              />
            </DialogContentSection>
          </>
        )}
      </DialogContent>
      <DialogFooter>
        <DialogFooterActionBar ariaLabel="Selection">
          {selectedMode !== "practice-band" && canReplaceSession ? (
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
