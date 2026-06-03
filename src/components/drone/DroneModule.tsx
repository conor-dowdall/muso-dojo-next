"use client";

import { useEffect, useMemo, useState } from "react";
import { type NoteCollectionKey } from "@musodojo/music-theory-data";
import { InstrumentNoteCell } from "@/components/instrument/InstrumentNoteCell";
import { useNoteColors } from "@/components/note-colors/NoteColorProvider";
import { PartModuleFrame } from "@/components/part-module/PartModuleFrame";
import { OverflowMenuButton } from "@/components/ui/object-menu";
import { useDroneNotePlayback } from "@/hooks/audio/useDroneNotePlayback";
import { useInstrumentNavigation } from "@/hooks/instrument/useInstrumentNavigation";
import { resolveDroneNotes } from "@/utils/drone/droneNotes";
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

export function DroneModule({
  noteCollectionKey,
  onClone,
  onRemove,
  rootNote,
  showHeader = true,
}: DroneModuleProps) {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const noteColors = useNoteColors();
  const droneNotes = useMemo(
    () =>
      resolveDroneNotes({
        noteCollectionKey,
        rootNote,
      }),
    [noteCollectionKey, rootNote],
  );
  const noteKeys = useMemo(
    () => droneNotes.notes.map((note) => String(note.interval)),
    [droneNotes.notes],
  );
  const initialFocusedKey = noteKeys[0] ?? "";
  const noteByKey = useMemo(
    () =>
      new Map(droneNotes.notes.map((note) => [String(note.interval), note])),
    [droneNotes.notes],
  );
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
      if (direction === "up" || direction === "down") {
        return currentKey;
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
        className={styles.droneFrame}
        headerActions={
          showHeader && canManageModule ? (
            <OverflowMenuButton
              aria-label="Drone options"
              onClick={() => setIsOptionsOpen(true)}
            />
          ) : undefined
        }
        showHeader={showHeader}
        widthMode="fill"
      >
        <div className={styles.noteRow}>
          {droneNotes.notes.map((note) => {
            const noteColor = resolveInstrumentNoteColor({
              midi: note.midi,
              mode: noteColors.mode,
              rootNote: droneNotes.rootNote,
            });
            const noteKey = String(note.interval);
            const isActive = isNoteActive(note.interval);

            return (
              <InstrumentNoteCell
                key={noteKey}
                noteKey={noteKey}
                note={{ midi: note.midi, emphasis: "large" }}
                noteColor={noteColor}
                midi={note.midi}
                label={note.label}
                ariaLabel={`${isActive ? "Stop" : "Start"} ${
                  note.label
                } drone note`}
                isFocused={focusedKey === noteKey}
                isToggleButton
                isPressed={isActive}
                setItemRef={setItemRef}
                handleKeyDown={handleKeyDown}
                onInteract={handleItemInteraction}
                className={styles.noteButton}
              />
            );
          })}
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
