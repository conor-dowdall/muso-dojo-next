"use client";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  ArrowDown,
  ArrowUpDown,
  ArrowUp,
  GitBranch,
  GitCommitHorizontal,
  GitFork,
  Merge,
  Minus,
  Play,
  Plus,
  Split,
  Square,
  WavesArrowDown,
  WavesArrowUp,
} from "lucide-react";
import { getDefaultAudioPresetId, type AudioPresetId } from "@/audio";
import { InstrumentNoteCell } from "@/components/instrument/InstrumentNoteCell";
import { useNoteColors } from "@/components/note-colors/NoteColorProvider";
import { NoteRangeHeaderActions } from "@/components/part-module/NoteRangeHeaderActions";
import { PartModuleFrame } from "@/components/part-module/PartModuleFrame";
import { TactileIconButton } from "@/components/ui/buttons/TactileButton";
import { OverflowMenuButton } from "@/components/ui/object-menu";
import { TactileControlGroup } from "@/components/ui/tactile-control-group/TactileControlGroup";
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
  type ExerciseNotePlayback,
  type ExercisePatternMode,
  type ExerciseScaleDirection,
} from "@/utils/exercise-looper/exerciseSequence";
import { formatMidiNote } from "@/utils/music-theory/midiNote";
import { resolveInstrumentNoteColor } from "@/utils/note-colors/resolveNoteColors";
import { ExerciseLooperOptionsDialog } from "./ExerciseLooperOptionsDialog";
import styles from "./ExerciseLooperModule.module.css";

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

function getCompactDirectionLabel(direction: ExerciseScaleDirection) {
  switch (direction) {
    case "ascending":
      return "Up";
    case "descending":
      return "Down";
    case "up-down":
      return "Up-down";
  }
}

const directionChoices = [
  { direction: "up-down", icon: <ArrowUpDown />, label: "Up and down" },
  { direction: "ascending", icon: <ArrowUp />, label: "Ascending" },
  { direction: "descending", icon: <ArrowDown />, label: "Descending" },
] as const satisfies readonly {
  direction: ExerciseScaleDirection;
  icon: ReactNode;
  label: string;
}[];

const patternModeChoices = [
  {
    icon: <GitCommitHorizontal />,
    label: "Single notes",
    mode: "single",
    readout: "Single notes",
  },
  {
    icon: <GitBranch />,
    label: "Play an interval from each note",
    mode: "interval",
    readout: "Intervals",
  },
  {
    icon: <GitFork />,
    label: "Play a chord from each note",
    mode: "extension",
    readout: "Chords",
  },
] as const satisfies readonly {
  icon: ReactNode;
  label: string;
  mode: ExercisePatternMode;
  readout: string;
}[];

const notePlaybackChoices = [
  {
    icon: <Split />,
    label: "Play notes separately",
    playback: "separate",
  },
  {
    icon: <Merge />,
    label: "Play notes together",
    playback: "together",
  },
] as const satisfies readonly {
  icon: ReactNode;
  label: string;
  playback: ExerciseNotePlayback;
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
  const intervalDegreeOptions = getExerciseDegreeOptions("interval");
  const extensionDegreeOptions = getExerciseDegreeOptions("extension");
  const intervalDegreeIndex = intervalDegreeOptions.indexOf(
    effectivePattern.intervalDegree,
  );
  const extensionDegreeIndex = extensionDegreeOptions.indexOf(
    effectivePattern.extensionDegree,
  );
  const canDecreaseIntervalDegree = intervalDegreeIndex > 0;
  const canIncreaseIntervalDegree =
    intervalDegreeIndex >= 0 &&
    intervalDegreeIndex < intervalDegreeOptions.length - 1;
  const canDecreaseExtensionDegree = extensionDegreeIndex > 0;
  const canIncreaseExtensionDegree =
    extensionDegreeIndex >= 0 &&
    extensionDegreeIndex < extensionDegreeOptions.length - 1;
  const intervalDegreeLabel = getExerciseIntervalLabel(
    effectivePattern.intervalDegree,
  );
  const extensionDegreeLabel = getExerciseIntervalLabel(
    effectivePattern.extensionDegree,
  );
  const activeNoteDirection =
    effectivePattern.mode === "interval"
      ? effectivePattern.intervalDirection
      : effectivePattern.mode === "extension"
        ? effectivePattern.extensionDirection
        : undefined;
  const activeDegreeLabel =
    effectivePattern.mode === "interval"
      ? intervalDegreeLabel
      : effectivePattern.mode === "extension"
        ? extensionDegreeLabel
        : "";
  const notePlaybackLabel =
    effectivePattern.mode === "single"
      ? ""
      : effectivePattern.notePlayback === "separate"
        ? "Separate"
        : "Together";
  const innerDirectionLabel =
    activeNoteDirection === undefined
      ? ""
      : getCompactDirectionLabel(activeNoteDirection);
  const fineTuneUnavailable = effectivePattern.mode === "single";
  const patternModeLabel =
    patternModeChoices.find((choice) => choice.mode === effectivePattern.mode)
      ?.readout ?? "Single notes";

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

  const updatePattern = (patch: Partial<ExercisePattern>) => {
    onPatternChange?.({ ...effectivePattern, ...patch });
  };
  const setPatternMode = (mode: ExercisePatternMode) => {
    if (mode === "extension" && !sequence.supportsTertianExercises) return;

    updatePattern({ mode });
  };
  const stepIntervalDegree = (offset: -1 | 1) => {
    const nextDegree = intervalDegreeOptions[intervalDegreeIndex + offset];
    if (nextDegree !== undefined) {
      updatePattern({ intervalDegree: nextDegree, mode: "interval" });
    }
  };
  const stepExtensionDegree = (offset: -1 | 1) => {
    if (!sequence.supportsTertianExercises) return;

    const nextDegree = extensionDegreeOptions[extensionDegreeIndex + offset];
    if (nextDegree !== undefined) {
      updatePattern({ extensionDegree: nextDegree, mode: "extension" });
    }
  };
  const canDecreaseActiveDegree =
    effectivePattern.mode === "interval"
      ? canDecreaseIntervalDegree
      : effectivePattern.mode === "extension" && canDecreaseExtensionDegree;
  const canIncreaseActiveDegree =
    effectivePattern.mode === "interval"
      ? canIncreaseIntervalDegree
      : effectivePattern.mode === "extension" && canIncreaseExtensionDegree;
  const stepActiveDegree = (offset: -1 | 1) => {
    if (effectivePattern.mode === "interval") {
      stepIntervalDegree(offset);
    } else if (effectivePattern.mode === "extension") {
      stepExtensionDegree(offset);
    }
  };
  const setActiveNoteDirection = (direction: ExerciseScaleDirection) => {
    if (effectivePattern.mode === "interval") {
      updatePattern({ intervalDirection: direction });
    } else if (effectivePattern.mode === "extension") {
      updatePattern({ extensionDirection: direction });
    }
  };
  const noteDirectionUnavailable =
    effectivePattern.mode === "single" ||
    effectivePattern.notePlayback === "together" ||
    (effectivePattern.mode === "extension" &&
      !sequence.supportsTertianExercises);

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
                showTooltips={false}
              />
              <OverflowMenuButton
                aria-label="Exercise Looper options"
                onClick={() => setIsOptionsOpen(true)}
                tooltip={false}
              />
            </div>
          ) : undefined
        }
        headerActionsGrow
      >
        <div className={styles.surface}>
          <div className={styles.controlDeck}>
            <TactileControlGroup
              aria-label="Exercise Looper playback controls"
              className={styles.playbackControlGroup}
              controlsClassName={styles.controls}
            >
              <TactileIconButton
                onPress={() => onOctaveOffsetChange?.(octaveOffset - 1)}
                aria-label="Shift exercise down one octave"
                icon={<WavesArrowDown />}
                size="lg"
                tooltip={false}
                unavailable={!canShiftDown}
              />
              <TactileIconButton
                aria-label={
                  playback.isPlaying ? "Stop exercise" : "Play exercise"
                }
                icon={playback.isPlaying ? <Square /> : <Play />}
                onPress={playback.isPlaying ? playback.stop : playback.start}
                size="lg"
                tooltip={false}
              />
              <TactileIconButton
                onPress={() => onOctaveOffsetChange?.(octaveOffset + 1)}
                aria-label="Shift exercise up one octave"
                icon={<WavesArrowUp />}
                size="lg"
                tooltip={false}
                unavailable={!canShiftUp}
              />
            </TactileControlGroup>

            <div
              className={styles.patternControls}
              role="group"
              aria-label="Exercise pattern"
            >
              <TactileControlGroup
                aria-label="Direction"
                controlsClassName={styles.directionControls}
              >
                {directionChoices.map((choice) => (
                  <TactileIconButton
                    key={choice.direction}
                    onPress={() =>
                      updatePattern({ direction: choice.direction })
                    }
                    aria-label={choice.label}
                    className={styles.directionButton}
                    icon={choice.icon}
                    selected={effectivePattern.direction === choice.direction}
                    size="lg"
                    tooltip={false}
                  />
                ))}
              </TactileControlGroup>

              <div className={styles.modeConfiguration}>
                <TactileControlGroup
                  aria-label="Play mode"
                  controlsClassName={styles.modeControls}
                  readout={patternModeLabel}
                >
                  {patternModeChoices.map((choice) => (
                    <TactileIconButton
                      key={choice.mode}
                      onPress={() => setPatternMode(choice.mode)}
                      aria-label={choice.label}
                      className={styles.modeButton}
                      icon={choice.icon}
                      selected={effectivePattern.mode === choice.mode}
                      size="lg"
                      tooltip={false}
                      unavailable={
                        choice.mode === "extension" &&
                        !sequence.supportsTertianExercises
                      }
                    />
                  ))}
                </TactileControlGroup>

                <div className={styles.fineTuneControls}>
                  <div
                    className={styles.degreeAndPlaybackControls}
                    role="group"
                    aria-label="Pattern detail"
                  >
                    <TactileControlGroup
                      aria-label="Interval or chord size"
                      controlsClassName={styles.degreeControls}
                      readout={activeDegreeLabel}
                      unavailable={fineTuneUnavailable}
                    >
                      <TactileIconButton
                        onPress={() => stepActiveDegree(-1)}
                        aria-label="Decrease interval or chord size"
                        className={`${styles.patternButton} ${styles.degreeButton}`}
                        icon={<Minus />}
                        size="md"
                        tooltip={false}
                        unavailable={!canDecreaseActiveDegree}
                      />
                      <TactileIconButton
                        onPress={() => stepActiveDegree(1)}
                        aria-label="Increase interval or chord size"
                        className={`${styles.patternButton} ${styles.degreeButton}`}
                        icon={<Plus />}
                        size="md"
                        tooltip={false}
                        unavailable={!canIncreaseActiveDegree}
                      />
                    </TactileControlGroup>

                    <TactileControlGroup
                      aria-label="Note playback"
                      controlsClassName={styles.contextualControls}
                      readout={notePlaybackLabel}
                      unavailable={fineTuneUnavailable}
                    >
                      {notePlaybackChoices.map((choice) => (
                        <TactileIconButton
                          key={choice.playback}
                          onPress={() =>
                            updatePattern({ notePlayback: choice.playback })
                          }
                          aria-label={choice.label}
                          className={styles.patternButton}
                          icon={choice.icon}
                          selected={
                            effectivePattern.mode !== "single" &&
                            effectivePattern.notePlayback === choice.playback
                          }
                          size="md"
                          tooltip={false}
                          unavailable={effectivePattern.mode === "single"}
                        />
                      ))}
                    </TactileControlGroup>
                  </div>

                  <TactileControlGroup
                    aria-label="Inner note direction"
                    className={styles.noteDirectionControlGroup}
                    controlsClassName={styles.noteDirectionControls}
                    readout={innerDirectionLabel}
                    unavailable={noteDirectionUnavailable}
                  >
                    {directionChoices.map((choice) => (
                      <TactileIconButton
                        key={choice.direction}
                        onPress={() => setActiveNoteDirection(choice.direction)}
                        aria-label={`Notes ${choice.label.toLowerCase()}`}
                        className={styles.patternButton}
                        icon={choice.icon}
                        selected={
                          !noteDirectionUnavailable &&
                          effectivePattern.notePlayback === "separate" &&
                          activeNoteDirection === choice.direction
                        }
                        size="md"
                        tooltip={false}
                        unavailable={noteDirectionUnavailable}
                      />
                    ))}
                  </TactileControlGroup>
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
                        surface="raised"
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
