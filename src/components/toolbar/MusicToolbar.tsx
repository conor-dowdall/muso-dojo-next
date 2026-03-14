"use client";

import { useMusicSystem } from "@/context/music-theory/MusicSystemContext";
import {
  groupedNoteCollections,
  type NoteCollectionGroupKey,
  conversions,
} from "@musodojo/music-theory-data";
import { useState } from "react";
import {
  MusicSelectorDialog,
  type MusicSelectorMode,
} from "./MusicSelectorDialog";
import { Circle, CircleDot, CircleOff } from "lucide-react";
import { useInstrumentShortcuts } from "@/hooks/useInstrumentShortcuts";

export default function MusicToolbar() {
  const musicSystem = useMusicSystem();
  const [dialogMode, setDialogMode] = useState<MusicSelectorMode | null>(null);

  useInstrumentShortcuts();

  if (!musicSystem) {
    return null;
  }

  const {
    rootNote,
    setRootNote,
    noteCollectionKey,
    setNoteCollectionKey,
    activeConversionId,
    setActiveConversionId,
    noteEmphasis,
    setNoteEmphasis,
  } = musicSystem;

  const toggleNoteEmphasis = () => {
    if (noteEmphasis === "large") setNoteEmphasis("small");
    else if (noteEmphasis === "small") setNoteEmphasis("hidden");
    else setNoteEmphasis("large");
  };

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

  const currentFormatName =
    activeConversionId === "midi"
      ? "MIDI Notes"
      : Object.values(conversions.rootAndNoteCollection).find(
          (c) => c.id === activeConversionId,
        )?.name || activeConversionId;

  const buttonStyle = {
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
    color: "inherit",
  };

  return (
    <>
      <div
        data-component="MusicToolbar"
        style={{
          display: "flex",
          gap: "1rem",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => setDialogMode("root")}
            style={buttonStyle}
            title="Change Root Note"
          >
            {rootNote}
          </button>
          <button
            onClick={() => setDialogMode("collection")}
            style={buttonStyle}
            title="Change Note Collection"
          >
            {getCurrentCollectionName()}
          </button>
          <button
            onClick={() => setDialogMode("format")}
            style={buttonStyle}
            title="Change Display Format"
          >
            {currentFormatName}
          </button>
          <button
            onClick={toggleNoteEmphasis}
            style={buttonStyle}
            title={`Note Size: ${noteEmphasis.charAt(0).toUpperCase() + noteEmphasis.slice(1)}`}
          >
            {noteEmphasis === "large" && <Circle size={16} />}
            {noteEmphasis === "small" && <CircleDot size={16} />}
            {noteEmphasis === "hidden" && <CircleOff size={16} />}
          </button>
        </div>
      </div>

      <MusicSelectorDialog
        isOpen={dialogMode !== null}
        mode={dialogMode || "root"} // Default to 'root' when closed to satisfy type
        onClose={() => setDialogMode(null)}
        rootNote={rootNote}
        noteCollectionKey={noteCollectionKey}
        activeConversionId={activeConversionId}
        onRootNoteChange={setRootNote}
        onNoteCollectionChange={setNoteCollectionKey}
        onConversionChange={setActiveConversionId}
      />
    </>
  );
}
