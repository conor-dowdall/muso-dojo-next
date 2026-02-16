"use client";

import { useMusicSystem } from "@/context/music-theory/MusicSystemContext";
import {
  groupedNoteCollections,
  type NoteCollectionGroupKey,
} from "@musodojo/music-theory-data";
import { useState } from "react";
import { MusicSelectorDialog } from "./MusicSelectorDialog";
import { Settings2 } from "lucide-react";

export default function MusicToolbar() {
  const musicSystem = useMusicSystem();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (!musicSystem) {
    return null;
  }

  const { rootNote, setRootNote, noteCollectionKey, setNoteCollectionKey } =
    musicSystem;

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

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: "1rem",
        }}
      >
        <button
          onClick={() => setIsDialogOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1rem",
            background: "none",
            border: "1px solid var(--border, #e4e4e7)",
            borderRadius: "8px",
            fontSize: "0.9rem",
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <Settings2 size={16} />
          <span>
            {rootNote} {getCurrentCollectionName()}
          </span>
        </button>
      </div>

      <MusicSelectorDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        rootNote={rootNote}
        noteCollectionKey={noteCollectionKey}
        onRootNoteChange={setRootNote}
        onNoteCollectionChange={setNoteCollectionKey}
      />
    </>
  );
}
