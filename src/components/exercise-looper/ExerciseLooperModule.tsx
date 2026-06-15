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
import {
  type ExerciseCountInBeats,
  type ExerciseSubdivision,
} from "@/types/session";
import { type InstrumentNoteInteractionTarget } from "@/types/instrument";
import {
  DEFAULT_EXERCISE_COUNT_IN_BEATS,
  DEFAULT_EXERCISE_METRONOME_ENABLED,
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
  getCollectionPosition,
  getCollectionRangeBoundary,
  getExerciseAnchorPositionBounds,
  getExerciseBaseOctave,
  type CollectionRangeBoundary,
  type ExercisePattern,
} from "@/utils/exercise-looper/exerciseSequence";
import {
  getExerciseAnchorDisplayNotes,
  resolveExerciseStudyDisplay,
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
  countInBeats = DEFAULT_EXERCISE_COUNT_IN_BEATS,
  end,
  moduleId,
  metronomeEnabled = DEFAULT_EXERCISE_METRONOME_ENABLED,
  noteCollectionKey,
  octaveOffset = 0,
  onAudioPresetIdChange,
  onClone,
  onCountInBeatsChange,
  onEndChange,
  onMetronomeEnabledChange,
  onOctaveOffsetChange,
  onPatternChange,
  onRemove,
  onOpenSessionTempo,
  onStartChange,
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
  countInBeats?: ExerciseCountInBeats;
  end?: CollectionRangeBoundary;
  moduleId: string;
  metronomeEnabled?: boolean;
  noteCollectionKey: Parameters<
    typeof createExerciseSequence
  >[0]["noteCollectionKey"];
  octaveOffset?: number;
  onAudioPresetIdChange?: (value: AudioPresetId) => void;
  onClone?: () => void;
  onCountInBeatsChange?: (value: ExerciseCountInBeats) => void;
  onEndChange?: (value: CollectionRangeBoundary) => void;
  onMetronomeEnabledChange?: (value: boolean) => void;
  onOctaveOffsetChange?: (value: number) => void;
  onPatternChange?: (value: ExercisePattern) => void;
  onRemove?: () => void;
  onOpenSessionTempo?: () => void;
  onStartChange?: (value: CollectionRangeBoundary) => void;
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
    countInBeats,
    id: moduleId,
    metronomeEnabled,
    steps: sequence.steps,
    subdivision,
    tempoBpm,
  });
  const noteKeys = useMemo(
    () => sequence.notes.map((note) => note.key),
    [sequence.notes],
  );
  const noteByKey = useMemo(
    () => new Map(sequence.notes.map((note) => [note.key, note])),
    [sequence.notes],
  );
  const handleNoteAudition = useCallback(
    (target: InstrumentNoteInteractionTarget) => {
      const root = noteByKey.get(target.key);

      if (effectivePattern.mode !== "single" && root !== undefined) {
        const exerciseNotes = getExerciseAnchorDisplayNotes(
          sequence,
          root.collectionPosition,
        );

        playback.auditionChord(
          exerciseNotes.map((note) => ({ key: note.key, midi: note.midi })),
        );
        return;
      }

      playback.audition(target);
    },
    [effectivePattern.mode, noteByKey, playback, sequence],
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
          sequence.rows[currentNote.rowIndex + (direction === "up" ? -1 : 1)];
        const nextNote = getClosestNoteInColumn(
          nextRow,
          currentNote.columnIndex,
        );

        return nextNote?.key ?? currentKey;
      }

      const currentIndex = noteKeys.indexOf(currentKey);
      const delta = direction === "left" ? -1 : 1;
      return (
        noteKeys[
          Math.max(0, Math.min(noteKeys.length - 1, currentIndex + delta))
        ] ?? currentKey
      );
    },
  });
  const focusedNote = noteByKey.get(focusedKey);
  const studyDisplay = resolveExerciseStudyDisplay({
    activeAnchorPosition: playback.activeAnchorPosition,
    focusedAnchorPosition: focusedNote?.collectionPosition,
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
    countInBeats === 0 ? "No Count In" : `${countInBeats} Beat Count In`;
  const octaveReadout = `Octave ${getExerciseBaseOctave(octaveOffset)}`;
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

  const setRange = (
    nextStart: CollectionRangeBoundary,
    nextEnd: CollectionRangeBoundary,
  ) => {
    const requestedStart = getCollectionPosition(
      nextStart,
      collectionSize,
      sequence.isFiniteVoicing,
    );
    const requestedEnd = getCollectionPosition(
      nextEnd,
      collectionSize,
      sequence.isFiniteVoicing,
    );
    const nextFirstPosition = Math.min(
      bounds.max,
      Math.max(bounds.min, Math.min(requestedStart, requestedEnd)),
    );
    const nextLastPosition = Math.min(
      bounds.max,
      nextFirstPosition + collectionSize * EXERCISE_MAX_OCTAVE_SPAN,
      Math.max(nextFirstPosition, requestedStart, requestedEnd),
    );

    onStartChange?.(
      getCollectionRangeBoundary(
        nextFirstPosition,
        collectionSize,
        sequence.isFiniteVoicing,
      ),
    );
    onEndChange?.(
      getCollectionRangeBoundary(
        nextLastPosition,
        collectionSize,
        sequence.isFiniteVoicing,
      ),
    );
  };

  return (
    <>
      <PartModuleFrame
        bodyClassName={styles.body}
        className={`${styles.frame} ${controlStyles.surface}`}
        headerPrimary={<InstrumentIdentity label="Looper" />}
        showHeader={showHeader}
        style={
          {
            "--looper-wood-background": woodSurfaces[wood].background,
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
        <div className={styles.surface}>
          <div className={styles.controlDeck}>
            <div
              aria-label="Looper performance controls"
              className={styles.performanceControls}
              role="group"
            >
              <div
                aria-label="Playback, tempo, and pulse controls"
                className={`${styles.playbackActionControls} ${controlStyles.groupCluster}`}
                role="group"
              >
                <TactileControlGroup aria-label="Playback">
                  <PartModuleControlButton
                    aria-label={
                      playback.isActive ? "Stop exercise" : "Play exercise"
                    }
                    icon={playback.isActive ? <Square /> : <Play />}
                    onPress={playback.isActive ? playback.stop : playback.start}
                    prominence="primary"
                    selected={playback.isActive}
                  />
                </TactileControlGroup>

                <div
                  aria-label="Tempo and metronome controls"
                  className={controlStyles.buttonGroup}
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
              </div>

              <TactileControlGroup
                aria-label="Count-in"
                className={styles.countInControlGroup}
                controlsClassName={controlStyles.buttonGroup}
                readout={countInReadout}
                readoutAriaLabel={countInReadout}
              >
                {countInChoices.map((beatCount) => {
                  const isSelected = countInBeats === beatCount;

                  return (
                    <PartModuleControlButton
                      key={beatCount}
                      aria-label={
                        isSelected
                          ? `Turn off the ${beatCount}-beat count-in`
                          : `Use a ${beatCount}-beat count-in`
                      }
                      icon={
                        <span aria-hidden="true" className={styles.beatCount}>
                          {beatCount}
                        </span>
                      }
                      onPress={() =>
                        onCountInBeatsChange?.(isSelected ? 0 : beatCount)
                      }
                      selected={isSelected}
                      unavailable={!onCountInBeatsChange}
                    />
                  );
                })}
              </TactileControlGroup>

              <TactileControlGroup
                aria-label="Exercise octave"
                className={styles.octaveControlGroup}
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
          collectionSize={collectionSize}
          end={getCollectionRangeBoundary(
            lastPosition,
            collectionSize,
            sequence.isFiniteVoicing,
          )}
          isFiniteVoicing={sequence.isFiniteVoicing}
          isOpen={isOptionsOpen}
          maxAnchorPosition={maxLastPosition}
          minAnchorPosition={bounds.min}
          start={getCollectionRangeBoundary(
            firstPosition,
            collectionSize,
            sequence.isFiniteVoicing,
          )}
          wood={wood}
          onAudioPresetIdChange={(value) => onAudioPresetIdChange?.(value)}
          onClone={onClone}
          onClose={() => setIsOptionsOpen(false)}
          onRangeChange={setRange}
          onRemove={onRemove}
          onWoodChange={(value) => onWoodChange?.(value)}
        />
      ) : null}
    </>
  );
}
