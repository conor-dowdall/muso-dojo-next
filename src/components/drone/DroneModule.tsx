"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { type NoteCollectionKey } from "@musodojo/music-theory-data";
import {
  LayersMinus,
  LayersPlus,
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
  DRONE_MAX_OCTAVE_ROWS,
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
  noteCollectionKey?: NoteCollectionKey;
  octaveOffset?: number;
  octaveRowCount?: number;
  onAudioPresetIdChange?: SettingSetter<AudioPresetId>;
  onOctaveOffsetChange?: SettingSetter<number>;
  onOctaveRowCountChange?: SettingSetter<number>;
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

function activateDroneToolOnPointerDown(
  event: PointerEvent<HTMLButtonElement>,
  action: () => void,
) {
  if (event.isPrimary && event.button === 0) {
    action();
  }
}

function activateDroneToolWithoutPointer(
  event: MouseEvent<HTMLButtonElement>,
  action: () => void,
) {
  // Keyboard and assistive-technology clicks have no pointer click count.
  if (event.detail === 0) {
    action();
  }
}

export function DroneModule({
  audioPresetId: controlledAudioPresetId,
  noteCollectionKey,
  octaveOffset: controlledOctaveOffset,
  octaveRowCount: controlledOctaveRowCount,
  onAudioPresetIdChange,
  onOctaveOffsetChange,
  onOctaveRowCountChange,
  onWoodChange,
  onRemove,
  rootNote,
  showHeader = true,
  wood: controlledWood,
}: DroneModuleProps) {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
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
  const [octaveRowCount, setOctaveRowCount] = useControllableState({
    value: controlledOctaveRowCount,
    defaultValue: DRONE_MIN_OCTAVE_ROWS,
    onChange: onOctaveRowCountChange,
    controlled:
      controlledOctaveRowCount !== undefined ||
      onOctaveRowCountChange !== undefined,
  });
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
        noteCollectionKey,
        octaveOffset,
        rowCount: octaveRowCount,
        rootNote,
      }),
    [noteCollectionKey, octaveOffset, octaveRowCount, rootNote],
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
      noteCollectionKey,
      octaveOffset: octaveOffset - 1,
      rowCount: octaveRowCount,
      rootNote,
    }).hasUnplayableNotes;
  }, [noteCollectionKey, octaveOffset, octaveRowCount, rootNote]);
  const canShiftOctaveUp = useMemo(() => {
    if (octaveOffset >= DRONE_MAX_OCTAVE_OFFSET) {
      return false;
    }

    return !resolveDroneNotes({
      noteCollectionKey,
      octaveOffset: octaveOffset + 1,
      rowCount: octaveRowCount,
      rootNote,
    }).hasUnplayableNotes;
  }, [noteCollectionKey, octaveOffset, octaveRowCount, rootNote]);
  const canRemoveOctaveRow = octaveRowCount > DRONE_MIN_OCTAVE_ROWS;
  const canAddOctaveRow = useMemo(() => {
    if (octaveRowCount >= DRONE_MAX_OCTAVE_ROWS) {
      return false;
    }

    return !resolveDroneNotes({
      noteCollectionKey,
      octaveOffset,
      rowCount: octaveRowCount + 1,
      rootNote,
    }).hasUnplayableNotes;
  }, [noteCollectionKey, octaveOffset, octaveRowCount, rootNote]);
  const { activeIntervals, isNoteActive, stopAll, toggleNote } =
    useDroneNotePlayback({
      audioPresetId,
      notes: droneNotes.notes,
    });
  const hasActiveDroneNotes = activeIntervals.length > 0;
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

  const removeOctaveRow = () => {
    setOctaveRowCount((current) =>
      Math.max(DRONE_MIN_OCTAVE_ROWS, current - 1),
    );
  };

  const addOctaveRow = () => {
    setOctaveRowCount((current) =>
      Math.min(DRONE_MAX_OCTAVE_ROWS, current + 1),
    );
  };
  const stopAllIfActive = () => {
    if (hasActiveDroneNotes) {
      stopAll();
    }
  };
  const shiftOctaveDownIfPlayable = () => {
    if (canShiftOctaveDown) {
      shiftOctaveDown();
    }
  };
  const shiftOctaveUpIfPlayable = () => {
    if (canShiftOctaveUp) {
      shiftOctaveUp();
    }
  };
  const removeOctaveRowIfAvailable = () => {
    if (canRemoveOctaveRow) {
      removeOctaveRow();
    }
  };
  const addOctaveRowIfPlayable = () => {
    if (canAddOctaveRow) {
      addOctaveRow();
    }
  };

  return (
    <>
      <PartModuleFrame
        bodyClassName={styles.droneBody}
        className={droneFrameClassName}
        headerActions={
          showHeader ? (
            <div className={styles.droneHeaderActions}>
              <span
                className={styles.droneHeaderActionGroup}
                role="group"
                aria-label="Drone row controls"
              >
                <IconButton
                  aria-label={`Remove final octave row. Current rows: ${octaveRowCount}`}
                  disabled={!canRemoveOctaveRow}
                  icon={<LayersMinus />}
                  size="sm"
                  onClick={removeOctaveRowIfAvailable}
                  tooltip={
                    canRemoveOctaveRow
                      ? "Remove final octave row"
                      : "Base octave row only"
                  }
                />
                <IconButton
                  aria-label={`Add octave row. Current rows: ${octaveRowCount}`}
                  disabled={!canAddOctaveRow}
                  icon={<LayersPlus />}
                  size="sm"
                  onClick={addOctaveRowIfPlayable}
                  tooltip={
                    canAddOctaveRow
                      ? "Add octave row"
                      : "Highest playable row reached"
                  }
                />
              </span>
              <OverflowMenuButton
                aria-label="Drone options"
                onClick={() => setIsOptionsOpen(true)}
              />
            </div>
          ) : undefined
        }
        headerActionsGrow
        showHeader={showHeader}
        style={droneFrameStyle}
      >
        <div className={styles.droneToolSurface}>
          <div
            ref={toolControlsRef}
            className={styles.droneToolControls}
            role="group"
            aria-label="Drone playback and octave controls"
          >
            <span
              className={styles.droneToolControlGroup}
              role="group"
              aria-label="Drone playback and octave controls"
            >
              <IconButton
                aria-label={`Shift drone down one octave. Current octave offset: ${octaveOffsetLabel}`}
                aria-disabled={!canShiftOctaveDown ? true : undefined}
                className={styles.droneToolButton}
                icon={<WavesArrowDown />}
                shouldYield={false}
                size="lg"
                onClick={(event) =>
                  activateDroneToolWithoutPointer(
                    event,
                    shiftOctaveDownIfPlayable,
                  )
                }
                onPointerDown={(event) =>
                  activateDroneToolOnPointerDown(
                    event,
                    shiftOctaveDownIfPlayable,
                  )
                }
                tooltip={
                  canShiftOctaveDown
                    ? "Shift octave down"
                    : "Lowest playable octave reached"
                }
              />
              <IconButton
                aria-label="Stop all active drone notes"
                aria-disabled={!hasActiveDroneNotes ? true : undefined}
                className={styles.droneToolButton}
                icon={<Square />}
                shouldYield={false}
                size="lg"
                onClick={(event) =>
                  activateDroneToolWithoutPointer(event, stopAllIfActive)
                }
                onPointerDown={(event) =>
                  activateDroneToolOnPointerDown(event, stopAllIfActive)
                }
                tooltip={
                  hasActiveDroneNotes ? "Stop all drones" : "No active drones"
                }
              />
              <IconButton
                aria-label={`Shift drone up one octave. Current octave offset: ${octaveOffsetLabel}`}
                aria-disabled={!canShiftOctaveUp ? true : undefined}
                className={styles.droneToolButton}
                icon={<WavesArrowUp />}
                shouldYield={false}
                size="lg"
                onClick={(event) =>
                  activateDroneToolWithoutPointer(
                    event,
                    shiftOctaveUpIfPlayable,
                  )
                }
                onPointerDown={(event) =>
                  activateDroneToolOnPointerDown(event, shiftOctaveUpIfPlayable)
                }
                tooltip={
                  canShiftOctaveUp
                    ? "Shift octave up"
                    : "Highest playable octave reached"
                }
              />
            </span>
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
