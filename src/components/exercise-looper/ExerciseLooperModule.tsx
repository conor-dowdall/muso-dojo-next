"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { Play, Square, WavesArrowDown, WavesArrowUp } from "lucide-react";
import { getDefaultAudioPresetId, type AudioPresetId } from "@/audio";
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
import { type InstrumentNoteInteractionTarget } from "@/types/instrument";
import {
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
  type CollectionRangeBoundary,
  type ExercisePattern,
} from "@/utils/exercise-looper/exerciseSequence";
import { resolveExerciseStudyChordDescriptor } from "@/utils/exercise-looper/exerciseStudyDisplay";
import { getClosestNoteInColumn } from "@/utils/instrument/getClosestNoteInColumn";
import { ExerciseLooperNoteGrid } from "./ExerciseLooperNoteGrid";
import { ExerciseLooperOptionsDialog } from "./ExerciseLooperOptionsDialog";
import { ExercisePatternControls } from "./ExercisePatternControls";
import styles from "./ExerciseLooperModule.module.css";

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
    case 6:
      return styles.rows6;
    case 7:
      return styles.rows7;
    default:
      return "";
  }
}

export function ExerciseLooperModule({
  audioPresetId,
  end,
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
  const noteByCollectionPosition = useMemo(
    () =>
      new Map(
        sequence.displayNotes.map(
          (note) => [note.collectionPosition, note] as const,
        ),
      ),
    [sequence.displayNotes],
  );
  const handleNoteAudition = useCallback(
    (target: InstrumentNoteInteractionTarget) => {
      const root = noteByKey.get(target.key);
      const descriptor =
        root === undefined
          ? undefined
          : sequence.chordDescriptorsByAnchorPosition.get(
              root.collectionPosition,
            );

      if (effectivePattern.mode === "extension" && descriptor) {
        playback.auditionChord(
          descriptor.midiNotes.map((midi, index) => {
            const collectionPosition = descriptor.collectionPositions[index];
            const visibleNote =
              collectionPosition === undefined
                ? undefined
                : noteByCollectionPosition.get(collectionPosition);

            return {
              ...(visibleNote ? { key: visibleNote.key } : {}),
              midi,
            };
          }),
        );
        return;
      }

      playback.audition(target);
    },
    [
      effectivePattern.mode,
      noteByCollectionPosition,
      noteByKey,
      playback,
      sequence.chordDescriptorsByAnchorPosition,
    ],
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
  const activeChordDescriptor =
    effectivePattern.mode === "extension" &&
    playback.activeAnchorPosition !== undefined
      ? sequence.chordDescriptorsByAnchorPosition.get(
          playback.activeAnchorPosition,
        )
      : undefined;
  const focusedNote = noteByKey.get(focusedKey);
  const focusedChordDescriptor =
    effectivePattern.mode === "extension" && focusedNote
      ? sequence.chordDescriptorsByAnchorPosition.get(
          focusedNote.collectionPosition,
        )
      : undefined;
  const studyChordDescriptor = resolveExerciseStudyChordDescriptor({
    activeChordDescriptor,
    focusedChordDescriptor,
    mode: effectivePattern.mode,
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
        className={[
          styles.frame,
          getLooperRowClassName(sequence.displayRows.length),
        ]
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
                  showOctaveActions={sequence.supportsOctaveRangeEditing}
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
                  playback.isActive ? "Stop exercise" : "Play exercise"
                }
                icon={playback.isActive ? <Square /> : <Play />}
                onPress={playback.isActive ? playback.stop : playback.start}
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
              chordDescriptor={studyChordDescriptor}
              onChange={onPatternChange}
              pattern={effectivePattern}
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
