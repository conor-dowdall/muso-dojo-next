"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Play, Square, WavesArrowDown, WavesArrowUp } from "lucide-react";
import { getDefaultAudioPresetId, type AudioPresetId } from "@/audio";
import { InstrumentNoteCell } from "@/components/instrument/InstrumentNoteCell";
import { useNoteColors } from "@/components/note-colors/NoteColorProvider";
import { NoteRangeHeaderActions } from "@/components/part-module/NoteRangeHeaderActions";
import { PartModuleHeaderActions } from "@/components/part-module/PartModuleHeaderActions";
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
} from "@/utils/exercise-looper/exerciseConfig";
import {
  createExerciseSequence,
  EXERCISE_MAX_OCTAVE_SPAN,
  getExerciseAnchorPositionBounds,
  getCollectionRangeBoundary,
  type CollectionRangeBoundary,
  type ExercisePattern,
} from "@/utils/exercise-looper/exerciseSequence";
import { formatMidiNote } from "@/utils/music-theory/midiNote";
import { resolveInstrumentNoteColor } from "@/utils/note-colors/resolveNoteColors";
import { getClosestNoteInColumn } from "@/utils/instrument/getClosestNoteInColumn";
import { ExerciseLooperOptionsDialog } from "./ExerciseLooperOptionsDialog";
import { ExercisePatternControls } from "./ExercisePatternControls";
import styles from "./ExerciseLooperModule.module.css";

function collectionPositionLabel(position: number, collectionSize: number) {
  if (position >= 0) {
    return String(position + 1);
  }

  const normalized =
    ((position % collectionSize) + collectionSize) % collectionSize;
  return String(normalized + 1);
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
    onInteract: playback.audition,
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
            <PartModuleHeaderActions
              center={
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
                  showTooltips={false}
                />
              }
              end={
                <OverflowMenuButton
                  aria-label="Exercise Looper options"
                  onClick={() => setIsOptionsOpen(true)}
                  tooltip={false}
                />
              }
            />
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
                unavailable={!canShiftDown}
              />
              <TactileIconButton
                aria-label={
                  playback.isPlaying ? "Stop exercise" : "Play exercise"
                }
                icon={playback.isPlaying ? <Square /> : <Play />}
                onPress={playback.isPlaying ? playback.stop : playback.start}
                size="lg"
              />
              <TactileIconButton
                onPress={() => onOctaveOffsetChange?.(octaveOffset + 1)}
                aria-label="Shift exercise up one octave"
                icon={<WavesArrowUp />}
                size="lg"
                unavailable={!canShiftUp}
              />
            </TactileControlGroup>

            <ExercisePatternControls
              onChange={onPatternChange}
              pattern={effectivePattern}
              supportsTertianExercises={sequence.supportsTertianExercises}
            />
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
                          playback.auditionActiveKeys.has(note.key) ||
                          (playback.isPlaying &&
                            playback.activeAnchorPosition ===
                              note.collectionPosition),
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
