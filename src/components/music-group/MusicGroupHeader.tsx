"use client";

import { useMusicGroup } from "./MusicGroupContext";
import {
  groupedNoteCollections,
  type NoteCollectionGroupKey,
  normalizeRootNoteString,
} from "@musodojo/music-theory-data";
import { useState } from "react";
import {
  Dialog,
  DialogHeader,
  DialogContent,
} from "@/components/ui/dialog/Dialog";
import { Button } from "@/components/ui/buttons/Button";
import { IconButton } from "@/components/ui/buttons/IconButton";
import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import { RootNotePicker } from "./RootNotePicker";
import { NoteCollectionPicker } from "./NoteCollectionPicker";
import { AddToMusicGroupDialog } from "./AddToMusicGroupDialog";
import styles from "./MusicGroupHeader.module.css";
import { Copy, Plus, X } from "lucide-react";
import { Heading } from "@/components/ui/typography/Heading";

interface MusicGroupHeaderProps {
  className?: string;
}

export function MusicGroupHeader({ className = "" }: MusicGroupHeaderProps) {
  const musicGroup = useMusicGroup();
  const [dialogMode, setDialogMode] = useState<
    "root" | "collection" | "add-to-music-group" | null
  >(null);

  const { rootNote, noteCollectionKey } = musicGroup;
  const rootNoteLabel = normalizeRootNoteString(rootNote) || rootNote;

  // Helper to get the display name of the current collection
  const getCurrentCollectionName = () => {
    for (const groupKey of Object.keys(
      groupedNoteCollections,
    ) as NoteCollectionGroupKey[]) {
      const collections = groupedNoteCollections[groupKey] as Record<
        string,
        { primaryName: string }
      >;
      if (collections[noteCollectionKey]) {
        return collections[noteCollectionKey].primaryName;
      }
    }
    return noteCollectionKey;
  };
  const noteCollectionName = getCurrentCollectionName();
  const headerClasses = [styles.musicGroupHeader, className]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={headerClasses}>
      <Heading as="h2" className={styles.titleWrapper}>
        <Tooltip text="Change root note" describeChild={false}>
          <Button
            aria-label={`Change root note. Current: ${rootNoteLabel}`}
            label={rootNoteLabel}
            size="sm"
            onClick={() => setDialogMode("root")}
          />
        </Tooltip>
        <Tooltip text="Change note collection" describeChild={false}>
          <Button
            aria-label={`Change note collection. Current: ${noteCollectionName}`}
            label={noteCollectionName}
            size="sm"
            onClick={() => setDialogMode("collection")}
          />
        </Tooltip>
      </Heading>

      <div className={styles.actionsWrapper}>
        {musicGroup.addInstrument ? (
          <IconButton
            aria-label="Add item"
            icon={<Plus />}
            size="sm"
            onClick={() => setDialogMode("add-to-music-group")}
          />
        ) : null}
        {musicGroup.cloneGroup ? (
          <IconButton
            aria-label="Duplicate group"
            icon={<Copy />}
            size="sm"
            onClick={musicGroup.cloneGroup}
          />
        ) : null}
        {musicGroup.removeGroup ? (
          <IconButton
            aria-label="Delete group"
            icon={<X />}
            size="sm"
            onClick={musicGroup.removeGroup}
          />
        ) : null}
      </div>

      <Dialog
        isOpen={dialogMode !== null}
        onClose={() => setDialogMode(null)}
        size={
          dialogMode === "add-to-music-group"
            ? "lg"
            : dialogMode === "root"
              ? "sm"
              : "md"
        }
      >
        {dialogMode === "add-to-music-group" && musicGroup.addInstrument ? (
          <AddToMusicGroupDialog
            onAddInstrument={musicGroup.addInstrument}
            onClose={() => setDialogMode(null)}
          />
        ) : (
          <>
            <DialogHeader
              title={
                dialogMode === "root"
                  ? "Choose Root Note"
                  : "Choose Note Collection"
              }
              onClose={() => setDialogMode(null)}
            />
            <DialogContent>
              {dialogMode === "root" && (
                <RootNotePicker onSelect={() => setDialogMode(null)} />
              )}
              {dialogMode === "collection" && (
                <NoteCollectionPicker onSelect={() => setDialogMode(null)} />
              )}
            </DialogContent>
          </>
        )}
      </Dialog>
    </header>
  );
}
