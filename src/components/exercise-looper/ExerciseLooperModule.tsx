"use client";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
} from "react";
import {
  LayersMinus,
  LayersPlus,
  ListMinus,
  ListPlus,
  Play,
  RotateCcw,
  Square,
  WavesArrowDown,
  WavesArrowUp,
} from "lucide-react";
import { getDefaultAudioPresetId, type AudioPresetId } from "@/audio";
import { InstrumentNoteCell } from "@/components/instrument/InstrumentNoteCell";
import { useNoteColors } from "@/components/note-colors/NoteColorProvider";
import { PartModuleFrame } from "@/components/part-module/PartModuleFrame";
import { IconButton } from "@/components/ui/buttons/IconButton";
import { OverflowMenuButton } from "@/components/ui/object-menu";
import {
  DEFAULT_WOOD_SURFACE_ID,
  woodSurfaces,
  type WoodSurfaceId,
} from "@/data/woodSurfaces";
import { useExerciseLooperPlayback } from "@/hooks/audio/useExerciseLooperPlayback";
import { useInstrumentNavigation } from "@/hooks/instrument/useInstrumentNavigation";
import { type ExerciseSubdivision } from "@/types/session";
import {
  DEFAULT_EXERCISE_END,
  DEFAULT_EXERCISE_PATTERN,
  DEFAULT_EXERCISE_START,
  DEFAULT_EXERCISE_SUBDIVISION,
  EXERCISE_MAX_OCTAVE_OFFSET,
  EXERCISE_MIN_OCTAVE_OFFSET,
} from "@/utils/exercise-looper/exerciseConfig";
import {
  createExerciseSequence,
  getCollectionPosition,
  getExerciseAnchorPositionBounds,
  type CollectionRangeBoundary,
  type ExercisePattern,
} from "@/utils/exercise-looper/exerciseSequence";
import { formatMidiNote } from "@/utils/music-theory/midiNote";
import { resolveInstrumentNoteColor } from "@/utils/note-colors/resolveNoteColors";
import { ExerciseLooperOptionsDialog } from "./ExerciseLooperOptionsDialog";
import styles from "./ExerciseLooperModule.module.css";

function activateOnPointerDown(
  event: PointerEvent<HTMLButtonElement>,
  action: () => void,
) {
  if (event.isPrimary && event.button === 0) action();
}

function activateWithoutPointer(
  event: MouseEvent<HTMLButtonElement>,
  action: () => void,
) {
  if (event.detail === 0) action();
}

function collectionPositionLabel(position: number, collectionSize: number) {
  if (position >= 0) {
    return String(position + 1);
  }

  const normalized =
    ((position % collectionSize) + collectionSize) % collectionSize;
  return String(normalized + 1);
}

export function ExerciseLooperModule({
  audioPresetId,
  countInBeats = 4,
  end = DEFAULT_EXERCISE_END,
  metronomeEnabled = true,
  moduleId,
  noteCollectionKey,
  octaveOffset = 0,
  onAudioPresetIdChange,
  onClone,
  onEndChange,
  onOctaveOffsetChange,
  onPatternChange,
  onRemove,
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
  countInBeats?: number;
  end?: CollectionRangeBoundary;
  metronomeEnabled?: boolean;
  moduleId: string;
  noteCollectionKey: Parameters<
    typeof createExerciseSequence
  >[0]["noteCollectionKey"];
  octaveOffset?: number;
  onAudioPresetIdChange?: (value: AudioPresetId) => void;
  onClone?: () => void;
  onEndChange?: (value: CollectionRangeBoundary) => void;
  onOctaveOffsetChange?: (value: number) => void;
  onPatternChange?: (value: ExercisePattern) => void;
  onRemove?: () => void;
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
  const sequence = useMemo(
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
  const effectivePattern =
    sequence.supportsTertianExercises || pattern.kind === "scale"
      ? pattern
      : DEFAULT_EXERCISE_PATTERN;
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
    () => sequence.steps.map((_, index) => `step-${index}`),
    [sequence.steps],
  );
  const { focusedKey, handleItemInteraction, handleKeyDown, setItemRef } =
    useInstrumentNavigation<HTMLElement>({
      getMidiForKey: (key) =>
        sequence.steps[Number(key.replace("step-", ""))]?.note.midi ?? 60,
      initialFocusedKey: noteKeys[0] ?? "",
      onInteract: (target) => playback.audition(target.midi),
      onNavigate: (currentKey, direction) => {
        const currentIndex = noteKeys.indexOf(currentKey);
        const delta = direction === "left" || direction === "up" ? -1 : 1;
        return (
          noteKeys[
            Math.max(0, Math.min(noteKeys.length - 1, currentIndex + delta))
          ] ?? currentKey
        );
      },
    });
  const collectionSize = sequence.collectionSize;
  const startPosition = getCollectionPosition(start, collectionSize);
  const endPosition = getCollectionPosition(end, collectionSize);
  const firstPosition = Math.min(startPosition, endPosition);
  const lastPosition = Math.max(startPosition, endPosition);
  const canRemoveNote = lastPosition - 1 > firstPosition;
  const canRemoveOctave = lastPosition - collectionSize > firstPosition;
  const canAddNote = lastPosition + 1 <= bounds.max;
  const canAddOctave = lastPosition + collectionSize <= bounds.max;
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

  useEffect(() => {
    if (effectivePattern !== pattern) {
      onPatternChange?.(effectivePattern);
    }
  }, [effectivePattern, onPatternChange, pattern]);

  const setEndPosition = (position: number) => {
    const octave = Math.floor(position / collectionSize);
    onEndChange?.({
      octave,
      stepOffset: position - octave * collectionSize,
    });
  };

  const toolActionProps = (action: () => void) => ({
    onClick: (event: MouseEvent<HTMLButtonElement>) =>
      activateWithoutPointer(event, action),
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) =>
      activateOnPointerDown(event, action),
  });

  return (
    <>
      <PartModuleFrame
        bodyClassName={styles.body}
        className={styles.frame}
        showHeader={showHeader}
        style={
          {
            "--looper-wood-background": woodSurfaces[wood].background,
          } as CSSProperties
        }
        headerActions={
          showHeader ? (
            <div className={styles.headerActions}>
              <span className={styles.headerGroup}>
                <IconButton
                  aria-label="Remove final collection note"
                  disabled={!canRemoveNote}
                  icon={<ListMinus />}
                  size="sm"
                  onClick={() =>
                    canRemoveNote && setEndPosition(lastPosition - 1)
                  }
                />
                <IconButton
                  aria-label="Add collection note"
                  disabled={!canAddNote}
                  icon={<ListPlus />}
                  size="sm"
                  onClick={() => canAddNote && setEndPosition(lastPosition + 1)}
                />
              </span>
              <span className={styles.headerGroup}>
                <IconButton
                  aria-label="Remove collection octave"
                  disabled={!canRemoveOctave}
                  icon={<LayersMinus />}
                  size="sm"
                  onClick={() =>
                    canRemoveOctave &&
                    setEndPosition(lastPosition - collectionSize)
                  }
                />
                <IconButton
                  aria-label="Add collection octave"
                  disabled={!canAddOctave}
                  icon={<LayersPlus />}
                  size="sm"
                  onClick={() =>
                    canAddOctave &&
                    setEndPosition(lastPosition + collectionSize)
                  }
                />
              </span>
              <OverflowMenuButton
                aria-label="Exercise Looper options"
                onClick={() => setIsOptionsOpen(true)}
              />
            </div>
          ) : undefined
        }
        headerActionsGrow
      >
        <div className={styles.surface}>
          <div
            className={styles.controls}
            role="group"
            aria-label="Exercise Looper playback controls"
          >
            <IconButton
              {...toolActionProps(() => {
                if (canShiftDown) onOctaveOffsetChange?.(octaveOffset - 1);
              })}
              aria-disabled={!canShiftDown ? true : undefined}
              aria-label="Shift exercise down one octave"
              className={styles.toolButton}
              icon={<WavesArrowDown />}
              shouldYield={false}
              size="lg"
            />
            <IconButton
              {...toolActionProps(playback.start)}
              aria-label={
                playback.isPlaying ? "Restart exercise" : "Play exercise"
              }
              className={styles.toolButton}
              icon={playback.isPlaying ? <RotateCcw /> : <Play />}
              shouldYield={false}
              size="lg"
            />
            <IconButton
              {...toolActionProps(playback.stop)}
              aria-disabled={!playback.isPlaying ? true : undefined}
              aria-label="Stop exercise"
              className={styles.toolButton}
              icon={<Square />}
              shouldYield={false}
              size="lg"
            />
            <IconButton
              {...toolActionProps(() => {
                if (canShiftUp) onOctaveOffsetChange?.(octaveOffset + 1);
              })}
              aria-disabled={!canShiftUp ? true : undefined}
              aria-label="Shift exercise up one octave"
              className={styles.toolButton}
              icon={<WavesArrowUp />}
              shouldYield={false}
              size="lg"
            />
          </div>

          <div className={styles.sequence}>
            {sequence.steps.map((step, stepIndex) => {
              const key = `step-${stepIndex}`;
              const noteColor = resolveInstrumentNoteColor({
                midi: step.note.midi,
                mode: noteColors.mode,
                rootNote,
              });
              return (
                <InstrumentNoteCell
                  key={key}
                  ariaLabel={`Audition ${formatMidiNote(step.note.midi)}, collection step ${step.note.collectionPosition + 1}`}
                  className={styles.noteButton}
                  handleKeyDown={handleKeyDown}
                  isFocused={focusedKey === key}
                  isHighlighted={
                    Boolean(playback.isPlaying) &&
                    Boolean(playback.activeStepIndex === stepIndex)
                  }
                  largeSize="100%"
                  midi={step.note.midi}
                  note={{ emphasis: "large", midi: step.note.midi }}
                  noteColor={noteColor}
                  noteKey={key}
                  onInteract={handleItemInteraction}
                  setItemRef={setItemRef}
                >
                  <span className={styles.label}>
                    <span>{formatMidiNote(step.note.midi)}</span>
                    <span>
                      {collectionPositionLabel(
                        step.note.collectionPosition,
                        collectionSize,
                      )}
                    </span>
                  </span>
                </InstrumentNoteCell>
              );
            })}
          </div>
        </div>
      </PartModuleFrame>

      {showHeader ? (
        <ExerciseLooperOptionsDialog
          audioPresetId={audioPresetId ?? getDefaultAudioPresetId("exercise")}
          collectionSize={collectionSize}
          end={end}
          isOpen={isOptionsOpen}
          maxAnchorPosition={bounds.max}
          minAnchorPosition={bounds.min}
          pattern={effectivePattern}
          start={start}
          subdivision={subdivision}
          supportsTertianExercises={sequence.supportsTertianExercises}
          wood={wood}
          onAudioPresetIdChange={(value) => onAudioPresetIdChange?.(value)}
          onClone={onClone}
          onClose={() => setIsOptionsOpen(false)}
          onEndChange={(value) => onEndChange?.(value)}
          onPatternChange={(value) => onPatternChange?.(value)}
          onRemove={onRemove}
          onStartChange={(value) => onStartChange?.(value)}
          onSubdivisionChange={(value) => onSubdivisionChange?.(value)}
          onWoodChange={(value) => onWoodChange?.(value)}
        />
      ) : null}
    </>
  );
}
