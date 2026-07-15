"use client";

import { useMusicPart } from "./MusicPartContext";
import {
  noteCollection,
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
import { ControlHeader } from "@/components/ui/control-header/ControlHeader";
import { RootNotePicker } from "@/components/music-theory/RootNotePicker";
import { NoteCollectionPicker } from "@/components/music-theory/NoteCollectionPicker";
import styles from "./MusicPartHeader.module.css";
import { Disc3, Music3, Orbit, Plus } from "lucide-react";
import { Heading } from "@/components/ui/typography/Heading";
import { OverflowMenuButton } from "@/components/ui/object-menu";
import { MusicPartMenuDialog } from "./MusicPartMenuDialog";
import { PartPlaybackDialog } from "./PartPlaybackDialog";
import { formatPartLengthBeats } from "@/utils/music-part/partLength";

interface MusicPartHeaderProps {
  className?: string;
  isPerformanceMode?: boolean;
  onOpenAddDialog?: () => void;
}

export function MusicPartHeader({
  className = "",
  isPerformanceMode = false,
  onOpenAddDialog,
}: MusicPartHeaderProps) {
  const musicPart = useMusicPart();
  const [dialogMode, setDialogMode] = useState<"root" | "collection" | null>(
    null,
  );
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPlaybackDialogOpen, setIsPlaybackDialogOpen] = useState(false);

  const { rootNote, noteCollectionKey } = musicPart;
  const hasPartMenu =
    !isPerformanceMode && Boolean(musicPart.clonePart || musicPart.removePart);
  const rootNoteLabel = normalizeRootNoteString(rootNote) || rootNote;
  const noteCollectionName = noteCollection.getDisplayName(noteCollectionKey);

  return (
    <>
      <ControlHeader
        className={className}
        primary={
          <Heading as="h2" className={styles.titleWrapper}>
            <Button
              aria-label={`Change root note. Current: ${rootNoteLabel}`}
              label={rootNoteLabel}
              size="sm"
              onClick={() => setDialogMode("root")}
            />
            <Button
              aria-label={`Change chord or scale. Current: ${noteCollectionName}`}
              label={noteCollectionName}
              size="sm"
              onClick={() => setDialogMode("collection")}
            />
          </Heading>
        }
        actions={
          <>
            {!isPerformanceMode &&
            musicPart.addPartModules &&
            onOpenAddDialog ? (
              <IconButton
                aria-label="Add to part"
                icon={<Plus />}
                size="sm"
                onClick={onOpenAddDialog}
              />
            ) : null}
            {!isPerformanceMode ? (
              <IconButton
                aria-label={`Backing Band options. Current Part length: ${formatPartLengthBeats(musicPart.effectiveLengthBeats)}`}
                icon={<Disc3 />}
                size="sm"
                onClick={() => setIsPlaybackDialogOpen(true)}
              />
            ) : null}
            {hasPartMenu ? (
              <OverflowMenuButton
                aria-label="Part actions"
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

      <PartPlaybackDialog
        isOpen={isPlaybackDialogOpen}
        onClose={() => setIsPlaybackDialogOpen(false)}
      />

      <Dialog
        isOpen={dialogMode !== null}
        onClose={() => setDialogMode(null)}
        size={dialogMode === "root" ? "compact" : "standard"}
      >
        <DialogHeader
          icon={dialogMode === "root" ? <Music3 /> : <Orbit />}
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
