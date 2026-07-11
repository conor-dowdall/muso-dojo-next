"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import {
  Gauge,
  Metronome,
  Play,
  Square,
  WavesArrowDown,
  WavesArrowUp,
} from "lucide-react";
import { getDefaultAudioPresetId, type AudioPresetId } from "@/audio";
import { InstrumentIdentity } from "@/components/instrument/InstrumentIdentity";
import { useNoteColors } from "@/components/note-colors/NoteColorProvider";
import { NoteRangeHeaderActions } from "@/components/part-module/NoteRangeHeaderActions";
import { PartModuleControlButton } from "@/components/part-module/PartModuleControlButton";
import { PartModuleHeaderActions } from "@/components/part-module/PartModuleHeaderActions";
import { PartModuleFrame } from "@/components/part-module/PartModuleFrame";
import { PartModuleBandBadge } from "@/components/part-module/PartModuleBandSource";
import controlStyles from "@/components/part-module/PartModuleControls.module.css";
import { OverflowMenuButton } from "@/components/ui/object-menu";
import { TactileControlGroup } from "@/components/ui/tactile-control-group/TactileControlGroup";
import {
  DEFAULT_WOOD_SURFACE_ID,
  woodSurfaces,
  type WoodSurfaceId,
} from "@/data/woodSurfaces";
import { useExerciseLooperPlayback } from "@/hooks/audio/useExerciseLooperPlayback";
import { useInstrumentNavigation } from "@/hooks/instrument/useInstrumentNavigation";
import { useScopedTransportShortcuts } from "@/hooks/interaction/useScopedTransportShortcuts";
import {
  type ExerciseCountInBeats,
  type ExerciseSubdivision,
} from "@/types/session";
import { type InstrumentNoteInteractionTarget } from "@/types/instrument";
import {
  DEFAULT_EXERCISE_METRONOME_ENABLED,
  DEFAULT_EXERCISE_OCTAVE_OFFSET,
  DEFAULT_EXERCISE_PATTERN,
  DEFAULT_EXERCISE_START,
  DEFAULT_EXERCISE_SUBDIVISION,
  EXERCISE_MAX_OCTAVE_OFFSET,
  EXERCISE_MIN_OCTAVE_OFFSET,
  exercisePatternsAreEqual,
} from "@/utils/exercise-looper/exerciseConfig";
import {
  createExerciseSequence,
  EXERCISE_MAX_OCTAVE_SPAN,
  getCollectionRangeBoundary,
  getExerciseAnchorPositionBounds,
  getExerciseBaseOctave,
  type CollectionRangeBoundary,
  type ExercisePattern,
} from "@/utils/exercise-looper/exerciseSequence";
import {
  createExerciseStudyAnchorIdentity,
  getExerciseAnchorDisplayNotes,
  resolveExerciseDisplayAnchorPosition,
  resolveExerciseStudyDisplay,
  type ExerciseStudyAnchorIdentity,
} from "@/utils/exercise-looper/exerciseStudyDisplay";
import { getClosestNoteInColumn } from "@/utils/instrument/getClosestNoteInColumn";
import { ExerciseLooperNoteGrid } from "./ExerciseLooperNoteGrid";
import { ExerciseLooperOptionsDialog } from "./ExerciseLooperOptionsDialog";
import { ExercisePatternControls } from "./ExercisePatternControls";
import styles from "./ExerciseLooperModule.module.css";

const countInChoices = [2, 3, 4] as const satisfies readonly Exclude<
  ExerciseCountInBeats,
  0
>[];

export function ExerciseLooperModule({
  audioPresetId,
  end,
  isBandSource = false,
  moduleId,
  metronomeEnabled = DEFAULT_EXERCISE_METRONOME_ENABLED,
  noteCollectionKey,
  octaveOffset = DEFAULT_EXERCISE_OCTAVE_OFFSET,
  onAudioPresetIdChange,
  onClone,
  onEndChange,
  onMetronomeEnabledChange,
  onOctaveOffsetChange,
  onPatternChange,
  onRemove,
  onOpenSessionTempo,
  onUseInBand,
  onSubdivisionChange,
  onWoodChange,
  pattern = DEFAULT_EXERCISE_PATTERN,
  rootNote,
  showHeader = true,
  start = DEFAULT_EXERCISE_START,
  subdivision = DEFAULT_EXERCISE_SUBDIVISION,
  tempoBpm = 80,
  wood = DEFAULT_WOOD_SURFACE_ID,
}: {
  audioPresetId?: AudioPresetId;
  end?: CollectionRangeBoundary;
  isBandSource?: boolean;
  moduleId: string;
  metronomeEnabled?: boolean;
  noteCollectionKey: Parameters<
    typeof createExerciseSequence
  >[0]["noteCollectionKey"];
  octaveOffset?: number;
  onAudioPresetIdChange?: (value: AudioPresetId) => void;
  onClone?: () => void;
  onEndChange?: (value: CollectionRangeBoundary) => void;
  onMetronomeEnabledChange?: (value: boolean) => void;
  onOctaveOffsetChange?: (value: number) => void;
  onPatternChange?: (value: ExercisePattern) => void;
  onRemove?: () => void;
  onOpenSessionTempo?: () => void;
  onUseInBand?: () => void;
  onSubdivisionChange?: (value: ExerciseSubdivision) => void;
  onWoodChange?: (value: WoodSurfaceId) => void;
  pattern?: ExercisePattern;
  rootNote: string;
  showHeader?: boolean;
  start?: CollectionRangeBoundary;
  subdivision?: ExerciseSubdivision;
  tempoBpm?: number;
  wood?: WoodSurfaceId;
}) {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [selectedStudyAnchor, setSelectedStudyAnchor] =
    useState<ExerciseStudyAnchorIdentity>();
  const noteColors = useNoteColors();
  const requestedSequence = useMemo(
    () =>
      createExerciseSequence({
        end,
        noteCollectionKey,
        octaveOffset,
        pattern,
        rootNote,
        start,
      }),
    [end, noteCollectionKey, octaveOffset, pattern, rootNote, start],
  );
  const effectivePattern = useMemo(
    () =>
      requestedSequence.supportsScaleDegreeExercises ||
      pattern.mode === "single"
        ? pattern
        : { ...pattern, mode: "single" as const },
    [pattern, requestedSequence.supportsScaleDegreeExercises],
  );
  const sequence = useMemo(
    () =>
      exercisePatternsAreEqual(effectivePattern, pattern)
        ? requestedSequence
        : createExerciseSequence({
            end,
            noteCollectionKey,
            octaveOffset,
            pattern: effectivePattern,
            rootNote,
            start,
          }),
    [
      effectivePattern,
      end,
      noteCollectionKey,
      octaveOffset,
      pattern,
      requestedSequence,
      rootNote,
      start,
    ],
  );
  const bounds = useMemo(
    () =>
      getExerciseAnchorPositionBounds({
        noteCollectionKey,
        octaveOffset,
        pattern: effectivePattern,
        rootNote,
      }),
    [effectivePattern, noteCollectionKey, octaveOffset, rootNote],
  );
  const playback = useExerciseLooperPlayback({
    audioPresetId,
    id: moduleId,
    metronomeEnabled,
    steps: sequence.steps,
    subdivision,
    tempoBpm,
  });
  const transportShortcuts = useScopedTransportShortcuts({
    isActive: playback.isActive,
    onStop: playback.stop,
  });
  const noteKeys = useMemo(
    () => sequence.displayNotes.map((note) => note.key),
    [sequence.displayNotes],
  );
  const noteByKey = useMemo(
    () => new Map(sequence.displayNotes.map((note) => [note.key, note])),
    [sequence.displayNotes],
  );
  const selectStudyAnchorForKey = useCallback(
    (key: string) => {
      const note = noteByKey.get(key);

      if (note !== undefined) {
        const anchorPosition = resolveExerciseDisplayAnchorPosition(
          sequence,
          note.collectionPosition,
        );
        const anchorNote =
          anchorPosition === undefined
            ? note
            : (noteByKey.get(`position-${anchorPosition}`) ?? note);

        setSelectedStudyAnchor(
          createExerciseStudyAnchorIdentity(sequence, anchorNote),
        );
      }

      return note;
    },
    [noteByKey, sequence],
  );
  const handleNoteAudition = useCallback(
    (target: InstrumentNoteInteractionTarget) => {
      const note = selectStudyAnchorForKey(target.key);

      if (effectivePattern.mode !== "single" && note !== undefined) {
        const anchorPosition =
          resolveExerciseDisplayAnchorPosition(
            sequence,
            note.collectionPosition,
          ) ?? note.collectionPosition;
        const exerciseNotes = getExerciseAnchorDisplayNotes(
          sequence,
          anchorPosition,
        );

        if (exerciseNotes.length > 0) {
          playback.auditionChord(
            exerciseNotes.map((note) => ({ key: note.key, midi: note.midi })),
          );
          return;
        }
      }

      playback.audition(target);
    },
    [effectivePattern.mode, playback, selectStudyAnchorForKey, sequence],
  );
  const {
    focusedKey,
    handleItemInteraction,
    handleKeyDown,
    setFocusedKey,
    setItemRef,
  } = useInstrumentNavigation<HTMLElement>({
    getMidiForKey: (key) => noteByKey.get(key)?.midi ?? 60,
    initialFocusedKey: noteKeys[0] ?? "",
    onInteract: handleNoteAudition,
    onNavigate: (currentKey, direction) => {
      const currentNote = noteByKey.get(currentKey);

      if (currentNote && (direction === "up" || direction === "down")) {
        const nextRow =
          sequence.displayRows[
            currentNote.rowIndex + (direction === "up" ? -1 : 1)
          ];
        const nextNote = getClosestNoteInColumn(
          nextRow,
          currentNote.columnIndex,
        );
        const nextKey = nextNote?.key ?? currentKey;

        selectStudyAnchorForKey(nextKey);
        return nextKey;
      }

      const currentIndex = noteKeys.indexOf(currentKey);
      const delta = direction === "left" ? -1 : 1;
      const nextKey =
        noteKeys[
          Math.max(0, Math.min(noteKeys.length - 1, currentIndex + delta))
        ] ?? currentKey;

      selectStudyAnchorForKey(nextKey);
      return nextKey;
    },
  });
  const studyDisplay = resolveExerciseStudyDisplay({
    activeAnchorPosition: playback.activeAnchorPosition,
    selectedAnchor: selectedStudyAnchor,
    mode: effectivePattern.mode,
    sequence,
  });
  const collectionSize = sequence.collectionSize;
  const firstPosition = sequence.firstPosition;
  const lastPosition = sequence.lastPosition;
  const maxLastPosition = Math.min(
    bounds.max,
    firstPosition + collectionSize * EXERCISE_MAX_OCTAVE_SPAN,
  );
  const canRemoveNote = lastPosition > firstPosition;
  const canRemoveOctave = lastPosition - collectionSize >= firstPosition;
  const canAddNote = lastPosition + 1 <= maxLastPosition;
  const canAddOctave = lastPosition + collectionSize <= maxLastPosition;
  const lowerOctaveBounds = useMemo(
    () =>
      getExerciseAnchorPositionBounds({
        noteCollectionKey,
        octaveOffset: octaveOffset - 1,
        pattern: effectivePattern,
        rootNote,
      }),
    [effectivePattern, noteCollectionKey, octaveOffset, rootNote],
  );
  const higherOctaveBounds = useMemo(
    () =>
      getExerciseAnchorPositionBounds({
        noteCollectionKey,
        octaveOffset: octaveOffset + 1,
        pattern: effectivePattern,
        rootNote,
      }),
    [effectivePattern, noteCollectionKey, octaveOffset, rootNote],
  );
  const canShiftDown =
    octaveOffset > EXERCISE_MIN_OCTAVE_OFFSET &&
    firstPosition >= lowerOctaveBounds.min &&
    lastPosition <= lowerOctaveBounds.max;
  const canShiftUp =
    octaveOffset < EXERCISE_MAX_OCTAVE_OFFSET &&
    firstPosition >= higherOctaveBounds.min &&
    lastPosition <= higherOctaveBounds.max;
  const countInReadout =
    playback.activeCountInBeats === undefined
      ? "No Count In"
      : `${playback.activeCountInBeats} Beat Count In`;
  const octaveReadout = `Octave ${getExerciseBaseOctave(octaveOffset)}`;
  const soundPreviewMidiNote = sequence.steps[0]?.notes[0]?.midi;
  useEffect(() => {
    if (!exercisePatternsAreEqual(effectivePattern, pattern)) {
      onPatternChange?.(effectivePattern);
    }
  }, [effectivePattern, onPatternChange, pattern]);

  useEffect(() => {
    const initialFocusedKey = noteKeys[0] ?? "";

    if (focusedKey !== initialFocusedKey && !noteByKey.has(focusedKey)) {
      setFocusedKey(initialFocusedKey);
    }
  }, [focusedKey, noteByKey, noteKeys, setFocusedKey]);

  const setEndPosition = (position: number) => {
    onEndChange?.(
      getCollectionRangeBoundary(
        position,
        collectionSize,
        sequence.isFiniteVoicing,
      ),
    );
  };

  return (
    <>
      <PartModuleFrame
        bodyClassName={controlStyles.body}
        className={`${styles.frame} ${controlStyles.surface}`}
        headerPrimary={
          <InstrumentIdentity
            accessory={isBandSource ? <PartModuleBandBadge /> : undefined}
            label="Looper"
          />
        }
        onKeyDownCapture={transportShortcuts.onKeyDownCapture}
        onPointerDownCapture={transportShortcuts.onPointerDownCapture}
        showHeader={showHeader}
        style={
          {
            "--part-module-body-background": woodSurfaces[wood].background,
          } as CSSProperties
        }
        headerActions={
          showHeader ? (
            <PartModuleHeaderActions
              controls={
                <NoteRangeHeaderActions
                  canAddNote={canAddNote}
                  canAddOctave={canAddOctave}
                  canRemoveNote={canRemoveNote}
                  canRemoveOctave={canRemoveOctave}
                  onAddNote={() =>
                    canAddNote && setEndPosition(lastPosition + 1)
                  }
                  onAddOctave={() =>
                    canAddOctave &&
                    setEndPosition(lastPosition + collectionSize)
                  }
                  onRemoveNote={() =>
                    canRemoveNote && setEndPosition(lastPosition - 1)
                  }
                  onRemoveOctave={() =>
                    canRemoveOctave &&
                    setEndPosition(lastPosition - collectionSize)
                  }
                  showOctaveActions={sequence.supportsOctaveRangeEditing}
                />
              }
              utility={
                <OverflowMenuButton
                  aria-label="Looper options"
                  onClick={() => setIsOptionsOpen(true)}
                />
              }
            />
          ) : undefined
        }
      >
        <div className={controlStyles.content}>
          <div className={controlStyles.controlDeck}>
            <div
              aria-label="Looper performance controls"
              className={controlStyles.performanceControls}
              role="group"
            >
              <div
                aria-label="Playback and count-in controls"
                className={controlStyles.groupRow}
                role="group"
              >
                <TactileControlGroup
                  aria-label="Playback"
                  className={controlStyles.controlGroup}
                >
                  <PartModuleControlButton
                    aria-label={
                      playback.isActive ? "Stop exercise" : "Play exercise"
                    }
                    aria-keyshortcuts={
                      playback.isActive ? "Space Escape" : undefined
                    }
                    icon={playback.isActive ? <Square /> : <Play />}
                    onPress={playback.isActive ? playback.stop : playback.start}
                    prominence="primary"
                    selected={playback.isActive}
                  />
                </TactileControlGroup>

                <TactileControlGroup
                  aria-label="Count-in"
                  className={controlStyles.controlGroup}
                  controlsClassName={controlStyles.buttonGroup}
                  readout={countInReadout}
                  readoutAriaLabel={countInReadout}
                >
                  {countInChoices.map((beatCount) => (
                    <PartModuleControlButton
                      key={beatCount}
                      aria-label={`${
                        playback.isActive ? "Restart" : "Play"
                      } exercise with a ${beatCount}-beat count-in`}
                      icon={
                        <span
                          aria-hidden="true"
                          className={controlStyles.controlSymbolLabel}
                        >
                          {beatCount}
                        </span>
                      }
                      onPress={() => playback.startWithIntro(beatCount)}
                      selected={playback.activeCountInBeats === beatCount}
                    />
                  ))}
                </TactileControlGroup>
              </div>

              <div
                aria-label="Tempo, metronome, and octave controls"
                className={controlStyles.groupRow}
                role="group"
              >
                <div
                  aria-label="Tempo and metronome controls"
                  className={`${styles.pulseControls} ${controlStyles.buttonGroup} ${controlStyles.controlGroup}`}
                  role="group"
                >
                  <TactileControlGroup
                    aria-label="Session tempo"
                    className={styles.pulseControlGroup}
                    readout={tempoBpm}
                    readoutAriaLabel={`Session tempo: ${tempoBpm} bpm`}
                    readoutClassName={styles.pulseReadout}
                  >
                    <PartModuleControlButton
                      activationEvent="click"
                      aria-label={`Set session tempo. Current tempo: ${tempoBpm} bpm`}
                      icon={<Gauge />}
                      onPress={() => onOpenSessionTempo?.()}
                      unavailable={!onOpenSessionTempo}
                    />
                  </TactileControlGroup>

                  <TactileControlGroup
                    aria-label="Metronome"
                    className={styles.pulseControlGroup}
                    readout={metronomeEnabled ? "On" : "Off"}
                    readoutAriaLabel={`Metronome: ${
                      metronomeEnabled ? "On" : "Off"
                    }`}
                    readoutClassName={styles.pulseReadout}
                  >
                    <PartModuleControlButton
                      aria-label={
                        metronomeEnabled
                          ? "Turn off metronome during exercise"
                          : "Turn on metronome during exercise"
                      }
                      icon={<Metronome />}
                      onPress={() =>
                        onMetronomeEnabledChange?.(!metronomeEnabled)
                      }
                      selected={metronomeEnabled}
                      unavailable={!onMetronomeEnabledChange}
                    />
                  </TactileControlGroup>
                </div>

                <TactileControlGroup
                  aria-label="Exercise octave"
                  className={controlStyles.controlGroup}
                  controlsClassName={controlStyles.buttonGroup}
                  readout={octaveReadout}
                  readoutAriaLabel={`Exercise pitch: ${octaveReadout}`}
                >
                  <PartModuleControlButton
                    onPress={() => onOctaveOffsetChange?.(octaveOffset - 1)}
                    aria-label={`Shift exercise down one octave. Current pitch: ${octaveReadout}`}
                    icon={<WavesArrowDown />}
                    unavailable={!onOctaveOffsetChange || !canShiftDown}
                  />
                  <PartModuleControlButton
                    onPress={() => onOctaveOffsetChange?.(octaveOffset + 1)}
                    aria-label={`Shift exercise up one octave. Current pitch: ${octaveReadout}`}
                    icon={<WavesArrowUp />}
                    unavailable={!onOctaveOffsetChange || !canShiftUp}
                  />
                </TactileControlGroup>
              </div>
            </div>

            <ExercisePatternControls
              onChange={onPatternChange}
              onSubdivisionChange={onSubdivisionChange}
              pattern={effectivePattern}
              studyDisplay={studyDisplay}
              subdivision={subdivision}
              supportsScaleDegreeExercises={
                sequence.supportsScaleDegreeExercises
              }
              supportsTertianExercises={sequence.supportsTertianExercises}
            />
          </div>

          <ExerciseLooperNoteGrid
            activeCollectionPositions={playback.activeCollectionPositions}
            auditionActiveKeys={playback.auditionActiveKeys}
            focusedKey={focusedKey}
            handleItemInteraction={handleItemInteraction}
            handleKeyDown={handleKeyDown}
            mode={effectivePattern.mode}
            noteColorMode={noteColors.mode}
            rootNote={rootNote}
            sequence={sequence}
            setItemRef={setItemRef}
          />
        </div>
      </PartModuleFrame>

      {showHeader ? (
        <ExerciseLooperOptionsDialog
          audioPresetId={audioPresetId ?? getDefaultAudioPresetId("exercise")}
          canShiftOctaveDown={canShiftDown}
          canShiftOctaveUp={canShiftUp}
          isPlaybackActive={playback.isActive}
          isBandSource={isBandSource}
          isOpen={isOptionsOpen}
          octaveOffset={octaveOffset}
          previewMidiNote={soundPreviewMidiNote}
          wood={wood}
          onAudioPresetIdChange={(value) => onAudioPresetIdChange?.(value)}
          onClone={onClone}
          onClose={() => setIsOptionsOpen(false)}
          onOctaveOffsetChange={onOctaveOffsetChange}
          onRemove={onRemove}
          onUseInBand={onUseInBand}
          onWoodChange={(value) => onWoodChange?.(value)}
        />
      ) : null}
    </>
  );
}
