"use client";

import { useEffect, useMemo, useState } from "react";
import { type NoteCollectionKey } from "@musodojo/music-theory-data";
import { ArrowDown, ArrowUp, Minus, Plus } from "lucide-react";
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
  DRONE_MAX_OCTAVE_OFFSET,
  DRONE_MAX_OCTAVE_ROWS,
  DRONE_MIN_OCTAVE_OFFSET,
  DRONE_MIN_OCTAVE_ROWS,
  resolveDroneNotes,
} from "@/utils/drone/droneNotes";
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
  onRemove?: () => void;
  rootNote?: string;
  showHeader?: boolean;
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

function getDroneLabelCharCount(label: string) {
  return Math.min(Array.from(label).length, 4);
}

function DroneTileLabel({ label }: { label: string }) {
  return (
    <span
      className={styles.droneTileText}
      data-chars={getDroneLabelCharCount(label)}
      data-is-placeholder={label === "" ? true : undefined}
    >
      {label}
    </span>
  );
}

export function DroneModule({
  audioPresetId: controlledAudioPresetId,
  noteCollectionKey,
  octaveOffset: controlledOctaveOffset,
  octaveRowCount: controlledOctaveRowCount,
  onAudioPresetIdChange,
  onOctaveOffsetChange,
  onOctaveRowCountChange,
  onRemove,
  rootNote,
  showHeader = true,
}: DroneModuleProps) {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
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
  const { isNoteActive, toggleNote } = useDroneNotePlayback({
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
        const nextNote =
          nextRow?.[Math.min(currentNote.columnIndex, nextRow.length - 1)];

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

  return (
    <>
      <PartModuleFrame
        bodyClassName={styles.droneBody}
        className={droneFrameClassName}
        headerActions={
          showHeader ? (
            <div className={styles.droneHeaderActions}>
              <OverflowMenuButton
                aria-label="Drone options"
                onClick={() => setIsOptionsOpen(true)}
              />
            </div>
          ) : undefined
        }
        headerActionsGrow
        showHeader={showHeader}
      >
        <div className={styles.droneToolSurface}>
          {showHeader ? (
            <div
              className={styles.droneToolControls}
              role="group"
              aria-label="Drone octave and row controls"
            >
              <span
                className={styles.droneToolControlGroup}
                role="group"
                aria-label="Drone octave controls"
              >
                <IconButton
                  aria-label={`Shift drone down one octave. Current octave offset: ${octaveOffsetLabel}`}
                  className={styles.droneToolButton}
                  disabled={!canShiftOctaveDown}
                  icon={<ArrowDown />}
                  size="md"
                  onClick={shiftOctaveDown}
                  tooltip={
                    canShiftOctaveDown
                      ? "Shift octave down"
                      : "Lowest playable octave reached"
                  }
                />
                <IconButton
                  aria-label={`Shift drone up one octave. Current octave offset: ${octaveOffsetLabel}`}
                  className={styles.droneToolButton}
                  disabled={!canShiftOctaveUp}
                  icon={<ArrowUp />}
                  size="md"
                  onClick={shiftOctaveUp}
                  tooltip={
                    canShiftOctaveUp
                      ? "Shift octave up"
                      : "Highest playable octave reached"
                  }
                />
              </span>
              <span
                className={styles.droneToolControlGroup}
                role="group"
                aria-label="Drone row controls"
              >
                <IconButton
                  aria-label={`Remove final octave row. Current rows: ${octaveRowCount}`}
                  className={styles.droneToolButton}
                  disabled={!canRemoveOctaveRow}
                  icon={<Minus />}
                  size="md"
                  onClick={removeOctaveRow}
                  tooltip={
                    canRemoveOctaveRow
                      ? "Remove final octave row"
                      : "Base octave row only"
                  }
                />
                <IconButton
                  aria-label={`Add octave row. Current rows: ${octaveRowCount}`}
                  className={styles.droneToolButton}
                  disabled={!canAddOctaveRow}
                  icon={<Plus />}
                  size="md"
                  onClick={addOctaveRow}
                  tooltip={
                    canAddOctaveRow
                      ? "Add octave row"
                      : "Highest playable row reached"
                  }
                />
              </span>
            </div>
          ) : null}
          <div className={styles.noteStack}>
            <div className={styles.noteRows}>
              {droneNotes.rows.map((row, rowIndex) => (
                <div key={rowIndex} className={styles.noteRow}>
                  {row.map((note) => {
                    const noteColor = resolveInstrumentNoteColor({
                      midi: note.midi,
                      mode: noteColors.mode,
                      rootNote: droneNotes.rootNote,
                    });
                    const isActive = isNoteActive(note.interval);

                    return (
                      <InstrumentNoteCell
                        key={note.key}
                        noteKey={note.key}
                        note={{ midi: note.midi, emphasis: "large" }}
                        noteColor={noteColor}
                        midi={note.midi}
                        ariaLabel={`${isActive ? "Stop" : "Start"} ${
                          note.label
                        } ${note.intervalLabel} drone note`}
                        isFocused={focusedKey === note.key}
                        isToggleButton
                        isHighlighted={isActive}
                        isPressed={isActive}
                        setItemRef={setItemRef}
                        handleKeyDown={handleKeyDown}
                        onInteract={handleItemInteraction}
                        className={styles.noteButton}
                        largeSize="100%"
                      >
                        <span className={styles.droneTileLabelStack}>
                          <span className={styles.droneTileNoteSlot}>
                            <DroneTileLabel label={note.label} />
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
          isOpen={isOptionsOpen}
          onAudioPresetIdChange={setAudioPresetId}
          onClose={() => setIsOptionsOpen(false)}
          onRemove={onRemove}
        />
      ) : null}
    </>
  );
}
