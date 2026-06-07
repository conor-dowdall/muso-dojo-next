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
  Minus,
  Play,
  Plus,
  Square,
  WavesArrowDown,
  WavesArrowUp,
} from "lucide-react";
import { getDefaultAudioPresetId, type AudioPresetId } from "@/audio";
import { InstrumentNoteCell } from "@/components/instrument/InstrumentNoteCell";
import { useNoteColors } from "@/components/note-colors/NoteColorProvider";
import { NoteRangeHeaderActions } from "@/components/part-module/NoteRangeHeaderActions";
import { PartModuleFrame } from "@/components/part-module/PartModuleFrame";
import { Button } from "@/components/ui/buttons/Button";
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
  exercisePatternsAreEqual,
  getExerciseDegreeOptions,
  getNearestExerciseDegree,
} from "@/utils/exercise-looper/exerciseConfig";
import {
  createExerciseSequence,
  EXERCISE_MAX_OCTAVE_SPAN,
  getExerciseAnchorPositionBounds,
  getCollectionRangeBoundary,
  getExerciseIntervalLabel,
  type ExerciseDisplayNote,
  type CollectionRangeBoundary,
  type ExercisePattern,
  type ExercisePatternMode,
  type ExerciseScaleDirection,
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

function getClosestNoteInColumn(
  row: readonly ExerciseDisplayNote[] | undefined,
  targetColumnIndex: number,
) {
  if (!row || row.length === 0) {
    return undefined;
  }

  return row.reduce((closestNote, candidateNote) =>
    Math.abs(candidateNote.columnIndex - targetColumnIndex) <
    Math.abs(closestNote.columnIndex - targetColumnIndex)
      ? candidateNote
      : closestNote,
  );
}

function getLooperRowClassName(rowCount: number) {
  switch (rowCount) {
    case 2:
      return styles.rows2;
    case 3:
      return styles.rows3;
    case 4:
      return styles.rows4;
    case 5:
      return styles.rows5;
    default:
      return "";
  }
}

const directionChoices = [
  { direction: "ascending", label: "Ascending" },
  { direction: "descending", label: "Descending" },
  { direction: "up-down", label: "Up and Down" },
] as const satisfies readonly {
  direction: ExerciseScaleDirection;
  label: string;
}[];

const patternModeChoices = [
  { label: "Single", mode: "single" },
  { label: "In", mode: "interval" },
  { label: "Up to", mode: "extension" },
] as const satisfies readonly {
  label: string;
  mode: ExercisePatternMode;
}[];

export function ExerciseLooperModule({
  audioPresetId,
  end = DEFAULT_EXERCISE_END,
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
  end?: CollectionRangeBoundary;
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
      requestedSequence.supportsTertianExercises || pattern.mode !== "extension"
        ? pattern
        : { ...pattern, mode: "single" as const },
    [pattern, requestedSequence.supportsTertianExercises],
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
  const {
    focusedKey,
    handleItemInteraction,
    handleKeyDown,
    setFocusedKey,
    setItemRef,
  } = useInstrumentNavigation<HTMLElement>({
    getMidiForKey: (key) => noteByKey.get(key)?.midi ?? 60,
    initialFocusedKey: noteKeys[0] ?? "",
    onInteract: (target) => playback.audition(target.midi),
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
  const degreeOptions = getExerciseDegreeOptions(effectivePattern.mode);
  const degreeIndex = degreeOptions.indexOf(effectivePattern.degree);
  const canDecreaseDegree =
    effectivePattern.mode !== "single" && degreeIndex > 0;
  const canIncreaseDegree =
    effectivePattern.mode !== "single" &&
    degreeIndex >= 0 &&
    degreeIndex < degreeOptions.length - 1;
  const intervalLabel = getExerciseIntervalLabel(effectivePattern.degree);
  const degreeLabel =
    effectivePattern.mode === "interval" ? `${intervalLabel}s` : intervalLabel;

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
    onEndChange?.(getCollectionRangeBoundary(position, collectionSize));
  };

  const setRange = (
    nextStart: CollectionRangeBoundary,
    nextEnd: CollectionRangeBoundary,
  ) => {
    const requestedStart =
      nextStart.octave * collectionSize + nextStart.stepOffset;
    const requestedEnd = nextEnd.octave * collectionSize + nextEnd.stepOffset;
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
      getCollectionRangeBoundary(nextFirstPosition, collectionSize),
    );
    onEndChange?.(getCollectionRangeBoundary(nextLastPosition, collectionSize));
  };

  const toolActionProps = (action: () => void) => ({
    onClick: (event: MouseEvent<HTMLButtonElement>) =>
      activateWithoutPointer(event, action),
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) =>
      activateOnPointerDown(event, action),
  });
  const updatePattern = (patch: Partial<ExercisePattern>) => {
    onPatternChange?.({ ...effectivePattern, ...patch });
  };
  const setPatternMode = (mode: ExercisePatternMode) => {
    if (mode === "extension" && !sequence.supportsTertianExercises) return;

    updatePattern({
      degree: getNearestExerciseDegree(effectivePattern.degree, mode),
      mode,
    });
  };
  const stepDegree = (offset: -1 | 1) => {
    const nextDegree = degreeOptions[degreeIndex + offset];
    if (nextDegree !== undefined) updatePattern({ degree: nextDegree });
  };

  return (
    <>
      <PartModuleFrame
        bodyClassName={styles.body}
        className={[styles.frame, getLooperRowClassName(sequence.rows.length)]
          .filter(Boolean)
          .join(" ")}
        showHeader={showHeader}
        style={
          {
            "--looper-wood-background": woodSurfaces[wood].background,
          } as CSSProperties
        }
        headerActions={
          showHeader ? (
            <div className={styles.headerActions}>
              <NoteRangeHeaderActions
                canAddNote={canAddNote}
                canAddOctave={canAddOctave}
                canRemoveNote={canRemoveNote}
                canRemoveOctave={canRemoveOctave}
                onAddNote={() => canAddNote && setEndPosition(lastPosition + 1)}
                onAddOctave={() =>
                  canAddOctave && setEndPosition(lastPosition + collectionSize)
                }
                onRemoveNote={() =>
                  canRemoveNote && setEndPosition(lastPosition - 1)
                }
                onRemoveOctave={() =>
                  canRemoveOctave &&
                  setEndPosition(lastPosition - collectionSize)
                }
              />
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
          <div className={styles.controlDeck}>
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
                {...toolActionProps(
                  playback.isPlaying ? playback.stop : playback.start,
                )}
                aria-label={
                  playback.isPlaying ? "Stop exercise" : "Play exercise"
                }
                className={styles.toolButton}
                icon={playback.isPlaying ? <Square /> : <Play />}
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

            <div
              className={styles.patternControls}
              role="group"
              aria-label="Exercise pattern"
            >
              <div
                className={styles.directionControls}
                role="group"
                aria-label="Direction"
              >
                {directionChoices.map((choice) => (
                  <Button
                    key={choice.direction}
                    {...toolActionProps(() =>
                      updatePattern({ direction: choice.direction }),
                    )}
                    aria-label={choice.label}
                    className={styles.patternButton}
                    density="compact"
                    label={choice.label}
                    selected={effectivePattern.direction === choice.direction}
                    shouldYield={false}
                    size="sm"
                  />
                ))}
              </div>

              <div className={styles.patternDetailControls}>
                <div
                  className={styles.modeControls}
                  role="group"
                  aria-label="Note pattern"
                >
                  {patternModeChoices.map((choice) => {
                    const unavailable =
                      choice.mode === "extension" &&
                      !sequence.supportsTertianExercises;
                    const ariaLabel =
                      choice.mode === "single"
                        ? "Single notes"
                        : choice.mode === "interval"
                          ? `In ${intervalLabel}s`
                          : `Up to the ${intervalLabel}`;

                    return (
                      <Button
                        key={choice.mode}
                        {...toolActionProps(() => {
                          if (!unavailable) setPatternMode(choice.mode);
                        })}
                        aria-disabled={unavailable ? true : undefined}
                        aria-label={ariaLabel}
                        className={styles.patternButton}
                        density="compact"
                        label={choice.label}
                        selected={effectivePattern.mode === choice.mode}
                        shouldYield={false}
                        size="sm"
                      />
                    );
                  })}
                </div>

                <div
                  className={styles.degreeControls}
                  role="group"
                  aria-label="Interval or extension"
                  data-unavailable={effectivePattern.mode === "single"}
                >
                  <IconButton
                    {...toolActionProps(() => {
                      if (canDecreaseDegree) stepDegree(-1);
                    })}
                    aria-disabled={!canDecreaseDegree ? true : undefined}
                    aria-label="Decrease degree"
                    className={`${styles.patternButton} ${styles.degreeButton}`}
                    icon={<Minus />}
                    shouldYield={false}
                    size="sm"
                  />
                  <output
                    className={styles.degreeDisplay}
                    aria-label={`Selected degree: ${degreeLabel}`}
                    aria-live="polite"
                  >
                    {degreeLabel}
                  </output>
                  <IconButton
                    {...toolActionProps(() => {
                      if (canIncreaseDegree) stepDegree(1);
                    })}
                    aria-disabled={!canIncreaseDegree ? true : undefined}
                    aria-label="Increase degree"
                    className={`${styles.patternButton} ${styles.degreeButton}`}
                    icon={<Plus />}
                    shouldYield={false}
                    size="sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={styles.noteStack}>
            <div
              className={styles.noteRows}
              style={
                {
                  "--looper-column-count": collectionSize,
                } as CSSProperties
              }
            >
              {sequence.rows.map((row, rowIndex) => (
                <div key={rowIndex} className={styles.noteRow}>
                  {row.map((note) => {
                    const noteColor = resolveInstrumentNoteColor({
                      midi: note.midi,
                      mode: noteColors.mode,
                      rootNote,
                    });

                    return (
                      <InstrumentNoteCell
                        key={note.key}
                        ariaLabel={`Audition ${formatMidiNote(note.midi)}, collection step ${note.collectionPosition + 1}`}
                        className={styles.noteButton}
                        handleKeyDown={handleKeyDown}
                        isFocused={focusedKey === note.key}
                        isHighlighted={Boolean(
                          playback.isPlaying &&
                          playback.activeAnchorPosition ===
                            note.collectionPosition,
                        )}
                        largeSize="100%"
                        midi={note.midi}
                        note={{ emphasis: "large", midi: note.midi }}
                        noteColor={noteColor}
                        noteKey={note.key}
                        onInteract={handleItemInteraction}
                        setItemRef={setItemRef}
                        style={{ gridColumn: note.columnIndex + 1 }}
                      >
                        <span className={styles.label}>
                          <span>{formatMidiNote(note.midi)}</span>
                          <span>
                            {collectionPositionLabel(
                              note.collectionPosition,
                              collectionSize,
                            )}
                          </span>
                        </span>
                      </InstrumentNoteCell>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </PartModuleFrame>

      {showHeader ? (
        <ExerciseLooperOptionsDialog
          audioPresetId={audioPresetId ?? getDefaultAudioPresetId("exercise")}
          collectionSize={collectionSize}
          end={getCollectionRangeBoundary(lastPosition, collectionSize)}
          isOpen={isOptionsOpen}
          maxAnchorPosition={maxLastPosition}
          minAnchorPosition={bounds.min}
          start={getCollectionRangeBoundary(firstPosition, collectionSize)}
          subdivision={subdivision}
          wood={wood}
          onAudioPresetIdChange={(value) => onAudioPresetIdChange?.(value)}
          onClone={onClone}
          onClose={() => setIsOptionsOpen(false)}
          onRangeChange={setRange}
          onRemove={onRemove}
          onSubdivisionChange={(value) => onSubdivisionChange?.(value)}
          onWoodChange={(value) => onWoodChange?.(value)}
        />
      ) : null}
    </>
  );
}
