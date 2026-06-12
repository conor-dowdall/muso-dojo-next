"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { type NoteCollectionKey } from "@musodojo/music-theory-data";
import { Square, WavesArrowDown, WavesArrowUp } from "lucide-react";
import { getDefaultAudioPresetId, type AudioPresetId } from "@/audio";
import { InstrumentNoteCell } from "@/components/instrument/InstrumentNoteCell";
import { useNoteColors } from "@/components/note-colors/NoteColorProvider";
import { NoteRangeHeaderActions } from "@/components/part-module/NoteRangeHeaderActions";
import { PartModuleFrame } from "@/components/part-module/PartModuleFrame";
import { TactileIconButton } from "@/components/ui/buttons/TactileButton";
import { OverflowMenuButton } from "@/components/ui/object-menu";
import { TactileControlGroup } from "@/components/ui/tactile-control-group/TactileControlGroup";
import { useDroneNotePlayback } from "@/hooks/audio/useDroneNotePlayback";
import { useInstrumentNavigation } from "@/hooks/instrument/useInstrumentNavigation";
import { useControllableState } from "@/hooks/useControllableState";
import { type SettingSetter } from "@/types/state";
import {
  DEFAULT_WOOD_SURFACE_ID,
  woodSurfaces,
  type WoodSurfaceId,
} from "@/data/woodSurfaces";
import {
  DRONE_MAX_OCTAVE_OFFSET,
  DRONE_MIN_OCTAVE_OFFSET,
  DRONE_MIN_OCTAVE_ROWS,
  resolveDroneNotes,
} from "@/utils/drone/droneNotes";
import { getMidiOctave } from "@/utils/music-theory/midiNote";
import { resolveInstrumentNoteColor } from "@/utils/note-colors/resolveNoteColors";
import { DroneOptionsDialog } from "./DroneOptionsDialog";
import styles from "./DroneModule.module.css";

interface DroneModuleProps {
  audioPresetId?: AudioPresetId;
  noteCount?: number;
  noteCollectionKey?: NoteCollectionKey;
  octaveOffset?: number;
  octaveRowCount?: number;
  onAudioPresetIdChange?: SettingSetter<AudioPresetId>;
  onNoteCountChange?: SettingSetter<number>;
  onOctaveOffsetChange?: SettingSetter<number>;
  onWoodChange?: SettingSetter<WoodSurfaceId>;
  onRemove?: () => void;
  rootNote?: string;
  showHeader?: boolean;
  wood?: WoodSurfaceId;
}

function formatOctaveOffset(octaveOffset: number) {
  if (octaveOffset === 0) {
    return "0";
  }

  return octaveOffset > 0 ? `+${octaveOffset}` : String(octaveOffset);
}

function getDroneRowClassName(rowCount: number) {
  switch (rowCount) {
    case 2:
      return styles.droneRows2;
    case 3:
      return styles.droneRows3;
    case 4:
      return styles.droneRows4;
    default:
      return "";
  }
}

function formatDroneNoteLabel(noteName: string, midi: number) {
  if (noteName === "") {
    return "";
  }

  return `${noteName}${getMidiOctave(midi)}`;
}

function getClosestNoteInColumn<TNote extends { columnIndex: number }>(
  row: readonly TNote[] | undefined,
  targetColumnIndex: number,
) {
  if (!row || row.length === 0) {
    return undefined;
  }

  return row.reduce((closestNote, candidateNote) => {
    const closestDistance = Math.abs(
      closestNote.columnIndex - targetColumnIndex,
    );
    const candidateDistance = Math.abs(
      candidateNote.columnIndex - targetColumnIndex,
    );

    return candidateDistance < closestDistance ? candidateNote : closestNote;
  });
}

function DroneTileLabel({ label }: { label: string }) {
  return (
    <span
      className={styles.droneTileText}
      data-is-placeholder={label === "" ? true : undefined}
    >
      {label}
    </span>
  );
}

export function DroneModule({
  audioPresetId: controlledAudioPresetId,
  noteCount: controlledNoteCount,
  noteCollectionKey,
  octaveOffset: controlledOctaveOffset,
  octaveRowCount: controlledOctaveRowCount,
  onAudioPresetIdChange,
  onNoteCountChange,
  onOctaveOffsetChange,
  onWoodChange,
  onRemove,
  rootNote,
  showHeader = true,
  wood: controlledWood,
}: DroneModuleProps) {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [internalNoteCount, setInternalNoteCount] = useState<number>();
  const toolControlsRef = useRef<HTMLDivElement | null>(null);
  const [toolControlsHeight, setToolControlsHeight] = useState<number>();
  const [audioPresetId, setAudioPresetId] = useControllableState({
    value: controlledAudioPresetId,
    defaultValue: getDefaultAudioPresetId("drone"),
    onChange: onAudioPresetIdChange,
    controlled:
      controlledAudioPresetId !== undefined ||
      onAudioPresetIdChange !== undefined,
  });
  const [octaveOffset, setOctaveOffset] = useControllableState({
    value: controlledOctaveOffset,
    defaultValue: 0,
    onChange: onOctaveOffsetChange,
    controlled:
      controlledOctaveOffset !== undefined ||
      onOctaveOffsetChange !== undefined,
  });
  const octaveRowCount = controlledOctaveRowCount ?? DRONE_MIN_OCTAVE_ROWS;
  const requestedNoteCount = controlledNoteCount ?? internalNoteCount;
  const [wood, setWood] = useControllableState<WoodSurfaceId>({
    value: controlledWood,
    defaultValue: DEFAULT_WOOD_SURFACE_ID,
    onChange: onWoodChange,
    controlled: controlledWood !== undefined || onWoodChange !== undefined,
  });
  const noteColors = useNoteColors();
  const droneNotes = useMemo(
    () =>
      resolveDroneNotes({
        noteCount: requestedNoteCount,
        noteCollectionKey,
        octaveOffset,
        rowCount: octaveRowCount,
        rootNote,
      }),
    [
      noteCollectionKey,
      octaveOffset,
      octaveRowCount,
      requestedNoteCount,
      rootNote,
    ],
  );
  const noteKeys = useMemo(
    () => droneNotes.notes.map((note) => note.key),
    [droneNotes.notes],
  );
  const initialFocusedKey = noteKeys[0] ?? "";
  const noteByKey = useMemo(
    () => new Map(droneNotes.notes.map((note) => [note.key, note])),
    [droneNotes.notes],
  );
  const canShiftOctaveDown = useMemo(() => {
    if (octaveOffset <= DRONE_MIN_OCTAVE_OFFSET) {
      return false;
    }

    return !resolveDroneNotes({
      noteCount: droneNotes.noteCount,
      noteCollectionKey,
      octaveOffset: octaveOffset - 1,
      rootNote,
    }).hasUnplayableNotes;
  }, [droneNotes.noteCount, noteCollectionKey, octaveOffset, rootNote]);
  const canShiftOctaveUp = useMemo(() => {
    if (octaveOffset >= DRONE_MAX_OCTAVE_OFFSET) {
      return false;
    }

    return !resolveDroneNotes({
      noteCount: droneNotes.noteCount,
      noteCollectionKey,
      octaveOffset: octaveOffset + 1,
      rootNote,
    }).hasUnplayableNotes;
  }, [droneNotes.noteCount, noteCollectionKey, octaveOffset, rootNote]);
  const canRemoveNote = droneNotes.noteCount > 1;
  const canRemoveOctave = droneNotes.noteCount - droneNotes.collectionSize >= 1;
  const canAddNote = droneNotes.noteCount < droneNotes.maxNoteCount;
  const canAddOctave =
    droneNotes.noteCount + droneNotes.collectionSize <= droneNotes.maxNoteCount;
  const { isNoteActive, stopAll, toggleNote } = useDroneNotePlayback({
    audioPresetId,
    notes: droneNotes.notes,
  });
  const {
    focusedKey,
    setFocusedKey,
    setItemRef,
    handleKeyDown,
    handleItemInteraction,
  } = useInstrumentNavigation<HTMLElement>({
    initialFocusedKey,
    onInteract: (target) => {
      const note = noteByKey.get(target.key);

      if (note) {
        toggleNote(note);
      }
    },
    getMidiForKey: (key) => noteByKey.get(key)?.midi ?? 60,
    onNavigate: (currentKey, direction) => {
      const currentNote = noteByKey.get(currentKey);

      if (currentNote && (direction === "up" || direction === "down")) {
        const nextRowIndex =
          currentNote.rowIndex + (direction === "up" ? -1 : 1);
        const nextRow = droneNotes.rows[nextRowIndex];
        const nextNote = getClosestNoteInColumn(
          nextRow,
          currentNote.columnIndex,
        );

        return nextNote?.key ?? currentKey;
      }

      const currentIndex = noteKeys.indexOf(currentKey);
      const nextIndex =
        currentIndex < 0
          ? 0
          : Math.min(
              noteKeys.length - 1,
              Math.max(0, currentIndex + (direction === "left" ? -1 : 1)),
            );

      return noteKeys[nextIndex] ?? currentKey;
    },
  });
  const octaveOffsetLabel = formatOctaveOffset(octaveOffset);
  const droneFrameClassName = [
    styles.droneFrame,
    getDroneRowClassName(droneNotes.rowCount),
  ]
    .filter(Boolean)
    .join(" ");
  const droneFrameStyle = useMemo(
    () =>
      ({
        "--drone-wood-background": woodSurfaces[wood].background,
        ...(toolControlsHeight === undefined
          ? {}
          : {
              "--drone-toolbar-reserved-height": `${toolControlsHeight}px`,
            }),
      }) as CSSProperties,
    [toolControlsHeight, wood],
  );
  useLayoutEffect(() => {
    const toolControls = toolControlsRef.current;

    if (!toolControls) {
      return;
    }

    const updateToolControlsHeight = () => {
      const nextHeight = Math.ceil(toolControls.getBoundingClientRect().height);

      if (nextHeight <= 0) {
        return;
      }

      setToolControlsHeight((currentHeight) =>
        currentHeight === nextHeight ? currentHeight : nextHeight,
      );
    };

    let animationFrameId: number | undefined;
    let timeoutId: number | undefined;

    const clearScheduledMeasurement = () => {
      if (animationFrameId !== undefined) {
        window.cancelAnimationFrame(animationFrameId);
        animationFrameId = undefined;
      }

      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
        timeoutId = undefined;
      }
    };

    const scheduleToolControlsHeightUpdate = () => {
      clearScheduledMeasurement();

      if (typeof window.requestAnimationFrame === "function") {
        animationFrameId = window.requestAnimationFrame(() => {
          animationFrameId = undefined;
          updateToolControlsHeight();
        });
        return;
      }

      timeoutId = window.setTimeout(() => {
        timeoutId = undefined;
        updateToolControlsHeight();
      }, 0);
    };

    scheduleToolControlsHeightUpdate();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", scheduleToolControlsHeightUpdate);

      return () => {
        clearScheduledMeasurement();
        window.removeEventListener("resize", scheduleToolControlsHeightUpdate);
      };
    }

    const resizeObserver = new ResizeObserver(scheduleToolControlsHeightUpdate);
    resizeObserver.observe(toolControls);

    return () => {
      clearScheduledMeasurement();
      resizeObserver.disconnect();
    };
  }, []);
  useEffect(() => {
    if (focusedKey === initialFocusedKey || noteByKey.has(focusedKey)) {
      return;
    }

    setFocusedKey(initialFocusedKey);
  }, [focusedKey, initialFocusedKey, noteByKey, setFocusedKey]);

  const shiftOctaveDown = () => {
    setOctaveOffset((current) =>
      Math.max(DRONE_MIN_OCTAVE_OFFSET, current - 1),
    );
  };

  const shiftOctaveUp = () => {
    setOctaveOffset((current) =>
      Math.min(DRONE_MAX_OCTAVE_OFFSET, current + 1),
    );
  };

  const setVisibleNoteCount = (nextNoteCount: number) => {
    if (controlledNoteCount === undefined && onNoteCountChange === undefined) {
      setInternalNoteCount(nextNoteCount);
    }

    onNoteCountChange?.(nextNoteCount);
  };
  return (
    <>
      <PartModuleFrame
        bodyClassName={styles.droneBody}
        className={droneFrameClassName}
        headerActions={
          showHeader ? (
            <div className={styles.droneHeaderActions}>
              <NoteRangeHeaderActions
                canAddNote={canAddNote}
                canAddOctave={canAddOctave}
                canRemoveNote={canRemoveNote}
                canRemoveOctave={canRemoveOctave}
                onAddNote={() =>
                  canAddNote && setVisibleNoteCount(droneNotes.noteCount + 1)
                }
                onAddOctave={() =>
                  canAddOctave &&
                  setVisibleNoteCount(
                    droneNotes.noteCount + droneNotes.collectionSize,
                  )
                }
                onRemoveNote={() =>
                  canRemoveNote && setVisibleNoteCount(droneNotes.noteCount - 1)
                }
                onRemoveOctave={() =>
                  canRemoveOctave &&
                  setVisibleNoteCount(
                    droneNotes.noteCount - droneNotes.collectionSize,
                  )
                }
                showTooltips={false}
              />
              <OverflowMenuButton
                aria-label="Drone options"
                onClick={() => setIsOptionsOpen(true)}
                tooltip={false}
              />
            </div>
          ) : undefined
        }
        headerActionsGrow
        showHeader={showHeader}
        style={droneFrameStyle}
      >
        <div className={styles.droneToolSurface}>
          <div ref={toolControlsRef} className={styles.droneToolControls}>
            <TactileControlGroup
              aria-label="Drone playback and octave controls"
              className={styles.droneToolControlGroup}
              controlsClassName={styles.droneToolControlButtons}
            >
              <TactileIconButton
                aria-label={`Shift drone down one octave. Current octave offset: ${octaveOffsetLabel}`}
                icon={<WavesArrowDown />}
                onPress={shiftOctaveDown}
                size="lg"
                tooltip={false}
                unavailable={!canShiftOctaveDown}
              />
              <TactileIconButton
                aria-label="Stop all active drone notes"
                icon={<Square />}
                onPress={stopAll}
                size="lg"
                tooltip={false}
              />
              <TactileIconButton
                aria-label={`Shift drone up one octave. Current octave offset: ${octaveOffsetLabel}`}
                icon={<WavesArrowUp />}
                onPress={shiftOctaveUp}
                size="lg"
                tooltip={false}
                unavailable={!canShiftOctaveUp}
              />
            </TactileControlGroup>
          </div>
          <div className={styles.noteStack}>
            <div
              className={styles.noteRows}
              style={
                {
                  "--drone-column-count": droneNotes.columnCount,
                } as CSSProperties
              }
            >
              {droneNotes.rows.map((row, rowIndex) => (
                <div key={rowIndex} className={styles.noteRow}>
                  {row.map((note) => {
                    const noteColor = resolveInstrumentNoteColor({
                      midi: note.midi,
                      mode: noteColors.mode,
                      rootNote: droneNotes.rootNote,
                    });
                    const isActive = isNoteActive(note.interval);
                    const noteLabel = formatDroneNoteLabel(
                      note.label,
                      note.midi,
                    );

                    return (
                      <InstrumentNoteCell
                        key={note.key}
                        noteKey={note.key}
                        note={{ midi: note.midi, emphasis: "large" }}
                        noteColor={noteColor}
                        midi={note.midi}
                        ariaLabel={`${isActive ? "Stop" : "Start"} ${
                          noteLabel
                        } ${note.intervalLabel} drone note`}
                        isFocused={focusedKey === note.key}
                        isToggleButton
                        isHighlighted={isActive}
                        isPressed={isActive}
                        setItemRef={setItemRef}
                        handleKeyDown={handleKeyDown}
                        onInteract={handleItemInteraction}
                        className={styles.noteButton}
                        style={{ gridColumn: note.columnIndex + 1 }}
                        largeSize="100%"
                        surface="raised"
                      >
                        <span className={styles.droneTileLabelStack}>
                          <span className={styles.droneTileNoteSlot}>
                            <DroneTileLabel label={noteLabel} />
                          </span>
                          <span className={styles.droneTileIntervalSlot}>
                            <DroneTileLabel label={note.intervalLabel} />
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
        <DroneOptionsDialog
          audioPresetId={audioPresetId}
          wood={wood}
          isOpen={isOptionsOpen}
          onAudioPresetIdChange={setAudioPresetId}
          onWoodChange={setWood}
          onClose={() => setIsOptionsOpen(false)}
          onRemove={onRemove}
        />
      ) : null}
    </>
  );
}
