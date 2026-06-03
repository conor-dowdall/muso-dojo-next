"use client";

import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { type NoteCollectionKey } from "@musodojo/music-theory-data";
import { ArrowDown, ArrowUp, Minus, Plus } from "lucide-react";
import { InstrumentNoteCell } from "@/components/instrument/InstrumentNoteCell";
import { useNoteColors } from "@/components/note-colors/NoteColorProvider";
import { PartModuleFrame } from "@/components/part-module/PartModuleFrame";
import { IconButton } from "@/components/ui/buttons/IconButton";
import { OverflowMenuButton } from "@/components/ui/object-menu";
import { useDroneNotePlayback } from "@/hooks/audio/useDroneNotePlayback";
import { useInstrumentNavigation } from "@/hooks/instrument/useInstrumentNavigation";
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
  noteCollectionKey?: NoteCollectionKey;
  onClone?: () => void;
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
  return Math.min(label.length, 4);
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
  noteCollectionKey,
  onClone,
  onRemove,
  rootNote,
  showHeader = true,
}: DroneModuleProps) {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [octaveOffset, setOctaveOffset] = useState(0);
  const [octaveRowCount, setOctaveRowCount] = useState(DRONE_MIN_OCTAVE_ROWS);
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
  const canManageModule = onClone !== undefined || onRemove !== undefined;
  const octaveOffsetLabel = formatOctaveOffset(octaveOffset);
  const droneFrameClassName = [
    styles.droneFrame,
    getDroneRowClassName(droneNotes.rowCount),
  ]
    .filter(Boolean)
    .join(" ");
  const droneFrameStyle = {
    maxWidth: "100%",
    width: "fit-content",
  } satisfies CSSProperties;

  useEffect(() => {
    if (focusedKey === initialFocusedKey || noteByKey.has(focusedKey)) {
      return;
    }

    setFocusedKey(initialFocusedKey);
  }, [focusedKey, initialFocusedKey, noteByKey, setFocusedKey]);

  return (
    <>
      <PartModuleFrame
        bodyClassName={styles.droneBody}
        className={droneFrameClassName}
        headerActions={
          showHeader ? (
            <div className={styles.droneHeaderActions}>
              <span
                className={styles.droneControlGroup}
                role="group"
                aria-label="Drone octave controls"
              >
                <IconButton
                  aria-label={`Shift drone down one octave. Current octave offset: ${octaveOffsetLabel}`}
                  disabled={!canShiftOctaveDown}
                  icon={<ArrowDown />}
                  size="sm"
                  onClick={() =>
                    setOctaveOffset((current) =>
                      Math.max(DRONE_MIN_OCTAVE_OFFSET, current - 1),
                    )
                  }
                  tooltip={
                    canShiftOctaveDown
                      ? "Shift octave down"
                      : "Lowest playable octave reached"
                  }
                />
                <IconButton
                  aria-label={`Shift drone up one octave. Current octave offset: ${octaveOffsetLabel}`}
                  disabled={!canShiftOctaveUp}
                  icon={<ArrowUp />}
                  size="sm"
                  onClick={() =>
                    setOctaveOffset((current) =>
                      Math.min(DRONE_MAX_OCTAVE_OFFSET, current + 1),
                    )
                  }
                  tooltip={
                    canShiftOctaveUp
                      ? "Shift octave up"
                      : "Highest playable octave reached"
                  }
                />
              </span>
              <span
                className={styles.droneControlGroup}
                role="group"
                aria-label="Drone row controls"
              >
                <IconButton
                  aria-label={`Remove final octave row. Current rows: ${octaveRowCount}`}
                  disabled={!canRemoveOctaveRow}
                  icon={<Minus />}
                  size="sm"
                  onClick={() =>
                    setOctaveRowCount((current) =>
                      Math.max(DRONE_MIN_OCTAVE_ROWS, current - 1),
                    )
                  }
                  tooltip={
                    canRemoveOctaveRow
                      ? "Remove final octave row"
                      : "Base octave row only"
                  }
                />
                <IconButton
                  aria-label={`Add octave row. Current rows: ${octaveRowCount}`}
                  disabled={!canAddOctaveRow}
                  icon={<Plus />}
                  size="sm"
                  onClick={() =>
                    setOctaveRowCount((current) =>
                      Math.min(DRONE_MAX_OCTAVE_ROWS, current + 1),
                    )
                  }
                  tooltip={
                    canAddOctaveRow
                      ? "Add octave row"
                      : "Highest playable row reached"
                  }
                />
              </span>
              {canManageModule ? (
                <OverflowMenuButton
                  aria-label="Drone options"
                  onClick={() => setIsOptionsOpen(true)}
                />
              ) : null}
            </div>
          ) : undefined
        }
        headerActionsGrow
        showHeader={showHeader}
        style={droneFrameStyle}
      >
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
                        <span className={styles.droneTileLabelSlot}>
                          <DroneTileLabel label={note.label} />
                        </span>
                        <span className={styles.droneTileLabelSlot}>
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
      </PartModuleFrame>

      {showHeader && canManageModule ? (
        <DroneOptionsDialog
          isOpen={isOptionsOpen}
          onClone={onClone}
          onClose={() => setIsOptionsOpen(false)}
          onRemove={onRemove}
        />
      ) : null}
    </>
  );
}
