"use client";

import { useMusicPart } from "./MusicPartContext";
import { normalizeRootNoteString } from "@musodojo/music-theory-data";
import { useState } from "react";
import {
  Dialog,
  DialogHeader,
  DialogContent,
} from "@/components/ui/dialog/Dialog";
import { Button } from "@/components/ui/buttons/Button";
import { IconButton } from "@/components/ui/buttons/IconButton";
import { ControlHeader } from "@/components/ui/control-header/ControlHeader";
import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import { RootNotePicker } from "@/components/music-theory/RootNotePicker";
import { NoteCollectionPicker } from "@/components/music-theory/NoteCollectionPicker";
import { getNoteCollectionDisplayName } from "@/utils/music-theory/getNoteCollectionDisplayName";
import styles from "./MusicPartHeader.module.css";
import { Plus } from "lucide-react";
import { Heading } from "@/components/ui/typography/Heading";
import { ObjectMenuTriggerButton } from "@/components/ui/object-menu";
import { MusicPartMenuDialog } from "./MusicPartMenuDialog";

interface MusicPartHeaderProps {
  className?: string;
  onOpenAddDialog?: () => void;
}

export function MusicPartHeader({
  className = "",
  onOpenAddDialog,
}: MusicPartHeaderProps) {
  const musicPart = useMusicPart();
  const [dialogMode, setDialogMode] = useState<"root" | "collection" | null>(
    null,
  );
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { rootNote, noteCollectionKey } = musicPart;
  const hasPartMenu = Boolean(
    musicPart.setPartDisplayFormatId ||
    musicPart.setPartNoteEmphasis ||
    musicPart.clonePart ||
    musicPart.removePart,
  );
  const rootNoteLabel = normalizeRootNoteString(rootNote) || rootNote;
  const noteCollectionName = getNoteCollectionDisplayName(noteCollectionKey);

  return (
    <>
      <ControlHeader
        className={className}
        primary={
          <Heading as="h2" className={styles.titleWrapper}>
            <Tooltip text="Change root note" describeChild={false}>
              <Button
                aria-label={`Change root note. Current: ${rootNoteLabel}`}
                label={rootNoteLabel}
                size="sm"
                onClick={() => setDialogMode("root")}
              />
            </Tooltip>
            <Tooltip text="Change chord or scale" describeChild={false}>
              <Button
                aria-label={`Change chord or scale. Current: ${noteCollectionName}`}
                label={noteCollectionName}
                size="sm"
                onClick={() => setDialogMode("collection")}
              />
            </Tooltip>
          </Heading>
        }
        actions={
          <>
            {musicPart.addPartModule && onOpenAddDialog ? (
              <IconButton
                aria-label="Add to part"
                icon={<Plus />}
                size="sm"
                onClick={onOpenAddDialog}
              />
            ) : null}
            {hasPartMenu ? (
              <ObjectMenuTriggerButton
                level="part"
                onClick={() => setIsMenuOpen(true)}
              />
            ) : null}
          </>
        }
      />

      {hasPartMenu ? (
        <MusicPartMenuDialog
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
        />
      ) : null}

      <Dialog
        isOpen={dialogMode !== null}
        onClose={() => setDialogMode(null)}
        size={dialogMode === "root" ? "sm" : "md"}
      >
        <DialogHeader
          title={
            dialogMode === "root" ? "Choose Root Note" : "Choose Chord or Scale"
          }
          onClose={() => setDialogMode(null)}
        />
        <DialogContent>
          {dialogMode === "root" && (
            <RootNotePicker
              value={rootNote}
              onChange={(nextRootNote) => {
                musicPart.setRootNote(nextRootNote);
                setDialogMode(null);
              }}
            />
          )}
          {dialogMode === "collection" && (
            <NoteCollectionPicker
              value={noteCollectionKey}
              onChange={(nextNoteCollectionKey) => {
                musicPart.setNoteCollectionKey(nextNoteCollectionKey);
                setDialogMode(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
